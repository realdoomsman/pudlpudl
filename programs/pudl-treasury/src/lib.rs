use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnV");

#[program]
pub mod pudl_treasury {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.authority = ctx.accounts.authority.key();
        treasury.pudl_mint = ctx.accounts.pudl_mint.key();
        treasury.buyback_bps = 10000; // 100%
        treasury.burn_bps = 3000;     // 30%
        treasury.staker_bps = 5000;   // 50%
        treasury.ops_bps = 2000;      // 20%
        treasury.last_harvest_at = Clock::get()?.unix_timestamp;
        treasury.total_fees_collected = 0;
        treasury.total_pudl_burned = 0;
        treasury.bump = ctx.bumps.treasury;

        Ok(())
    }

    pub fn record_fee(
        ctx: Context<RecordFee>,
        amount: u64,
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.fee_vault.to_account_info(),
                    authority: ctx.accounts.pool_authority.to_account_info(),
                },
            ),
            amount,
        )?;

        treasury.total_fees_collected += amount;

        emit!(FeeRecorded {
            pool: ctx.accounts.pool_authority.key(),
            mint: ctx.accounts.fee_vault.mint,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn harvest_and_convert(ctx: Context<HarvestAndConvert>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        let fee_vault_balance = ctx.accounts.fee_vault.amount;

        if fee_vault_balance == 0 {
            return Ok(());
        }

        // In production, this would call Jupiter CPI
        // For now, simplified: assume conversion happened
        let pudl_out = fee_vault_balance; // 1:1 for demo

        let burned = (pudl_out as u128 * treasury.burn_bps as u128 / 10000) as u64;
        let to_stakers = (pudl_out as u128 * treasury.staker_bps as u128 / 10000) as u64;
        let to_ops = (pudl_out as u128 * treasury.ops_bps as u128 / 10000) as u64;

        treasury.total_pudl_burned += burned;
        treasury.last_harvest_at = Clock::get()?.unix_timestamp;

        emit!(Harvested {
            total_in: fee_vault_balance,
            pudl_out,
            burned,
            to_stakers,
            to_ops,
        });

        Ok(())
    }

    pub fn set_split(
        ctx: Context<SetSplit>,
        burn_bps: u16,
        staker_bps: u16,
        ops_bps: u16,
    ) -> Result<()> {
        require!(
            burn_bps as u32 + staker_bps as u32 + ops_bps as u32 == 10000,
            ErrorCode::InvalidSplit
        );

        let treasury = &mut ctx.accounts.treasury;
        treasury.burn_bps = burn_bps;
        treasury.staker_bps = staker_bps;
        treasury.ops_bps = ops_bps;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::LEN,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    pub pudl_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordFee<'info> {
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub source: Account<'info, TokenAccount>,

    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,

    /// CHECK: Pool authority
    pub pool_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct HarvestAndConvert<'info> {
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub fee_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub rewards_vault: Account<'info, TokenAccount>,

    /// CHECK: Burn address
    pub burn_address: AccountInfo<'info>,

    /// CHECK: Ops wallet
    pub ops_wallet: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetSplit<'info> {
    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump,
        constraint = treasury.authority == authority.key()
    )]
    pub treasury: Account<'info, Treasury>,

    pub authority: Signer<'info>,
}

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub pudl_mint: Pubkey,
    pub buyback_bps: u16,
    pub burn_bps: u16,
    pub staker_bps: u16,
    pub ops_bps: u16,
    pub last_harvest_at: i64,
    pub total_fees_collected: u64,
    pub total_pudl_burned: u64,
    pub bump: u8,
}

impl Treasury {
    pub const LEN: usize = 32 + 32 + 2 + 2 + 2 + 2 + 8 + 8 + 8 + 1;
}

#[event]
pub struct FeeRecorded {
    pub pool: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct Harvested {
    pub total_in: u64,
    pub pudl_out: u64,
    pub burned: u64,
    pub to_stakers: u64,
    pub to_ops: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Split bps must sum to 10000")]
    InvalidSplit,
    #[msg("Swap failed")]
    SwapFailed,
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
}
