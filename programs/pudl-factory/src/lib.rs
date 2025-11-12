use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod pudl_factory {
    use super::*;

    pub fn initialize_factory(
        ctx: Context<InitializeFactory>,
        bond_amount: u64,
        min_base_fee_bps: u16,
        max_base_fee_bps: u16,
    ) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        factory.admin = ctx.accounts.admin.key();
        factory.treasury = ctx.accounts.treasury.key();
        factory.router = ctx.accounts.router.key();
        factory.bond_mint = ctx.accounts.bond_mint.key();
        factory.bond_amount = bond_amount;
        factory.max_base_fee_bps = max_base_fee_bps;
        factory.min_base_fee_bps = min_base_fee_bps;
        factory.fee_scheduler_enabled = false;
        factory.total_pools = 0;
        factory.bump = ctx.bumps.factory;

        emit!(FactoryInitialized {
            admin: factory.admin,
            bond_mint: factory.bond_mint,
            bond_amount: factory.bond_amount,
        });

        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        base_fee_bps: u16,
        bin_step: u16,
        initial_price_x64: u128,
    ) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        
        require!(
            base_fee_bps >= factory.min_base_fee_bps && base_fee_bps <= factory.max_base_fee_bps,
            ErrorCode::InvalidFeeRange
        );

        // Transfer bonded $PUDL to bond vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_pudl_account.to_account_info(),
                    to: ctx.accounts.bond_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            factory.bond_amount,
        )?;

        let pool = &mut ctx.accounts.pool_meta;
        pool.base_mint = ctx.accounts.base_mint.key();
        pool.quote_mint = ctx.accounts.quote_mint.key();
        pool.creator = ctx.accounts.user.key();
        pool.base_fee_bps = base_fee_bps;
        pool.bin_step = bin_step;
        pool.initial_price_x64 = initial_price_x64;
        pool.pool_authority = ctx.accounts.pool_meta.key();
        pool.bond_vault = ctx.accounts.bond_vault.key();
        pool.created_at = Clock::get()?.unix_timestamp;
        pool.flags = 1; // Active flag
        pool.bump = ctx.bumps.pool_meta;

        factory.total_pools += 1;

        emit!(PoolCreated {
            pool: pool.key(),
            creator: pool.creator,
            base_mint: pool.base_mint,
            quote_mint: pool.quote_mint,
            fee_bps: base_fee_bps,
            bin_step,
        });

        Ok(())
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        let pool = &ctx.accounts.pool_meta;
        let factory = &ctx.accounts.factory;

        require!(pool.flags & 1 == 0, ErrorCode::PoolStillActive);

        let bond_amount = factory.bond_amount;
        let seeds = &[
            b"bond",
            pool.key().as_ref(),
            &[ctx.bumps.bond_vault],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.bond_vault.to_account_info(),
                    to: ctx.accounts.creator_pudl_account.to_account_info(),
                    authority: ctx.accounts.bond_vault.to_account_info(),
                },
                signer,
            ),
            bond_amount,
        )?;

        emit!(PoolClosed {
            pool: pool.key(),
            returned_bond: bond_amount,
        });

        Ok(())
    }

    pub fn set_params(
        ctx: Context<SetParams>,
        new_bond_amount: Option<u64>,
        new_min_fee: Option<u16>,
        new_max_fee: Option<u16>,
    ) -> Result<()> {
        let factory = &mut ctx.accounts.factory;

        if let Some(amount) = new_bond_amount {
            factory.bond_amount = amount;
        }
        if let Some(min) = new_min_fee {
            factory.min_base_fee_bps = min;
        }
        if let Some(max) = new_max_fee {
            factory.max_base_fee_bps = max;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeFactory<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Factory::LEN,
        seeds = [b"factory"],
        bump
    )]
    pub factory: Account<'info, Factory>,
    
    pub bond_mint: Account<'info, Mint>,
    
    /// CHECK: Treasury program
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Router program
    pub router: AccountInfo<'info>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(base_fee_bps: u16, bin_step: u16)]
pub struct CreatePool<'info> {
    #[account(
        mut,
        seeds = [b"factory"],
        bump = factory.bump
    )]
    pub factory: Account<'info, Factory>,

    #[account(
        init,
        payer = user,
        space = 8 + PoolMeta::LEN,
        seeds = [b"pool", base_mint.key().as_ref(), quote_mint.key().as_ref(), &bin_step.to_le_bytes()],
        bump
    )]
    pub pool_meta: Account<'info, PoolMeta>,

    #[account(
        init,
        payer = user,
        token::mint = factory.bond_mint,
        token::authority = bond_vault,
        seeds = [b"bond", pool_meta.key().as_ref()],
        bump
    )]
    pub bond_vault: Account<'info, TokenAccount>,

    pub base_mint: Account<'info, Mint>,
    pub quote_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_pudl_account.mint == factory.bond_mint
    )]
    pub user_pudl_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(seeds = [b"factory"], bump = factory.bump)]
    pub factory: Account<'info, Factory>,

    #[account(
        mut,
        seeds = [b"pool", pool_meta.base_mint.as_ref(), pool_meta.quote_mint.as_ref(), &pool_meta.bin_step.to_le_bytes()],
        bump = pool_meta.bump,
        constraint = pool_meta.creator == creator.key()
    )]
    pub pool_meta: Account<'info, PoolMeta>,

    #[account(
        mut,
        seeds = [b"bond", pool_meta.key().as_ref()],
        bump
    )]
    pub bond_vault: Account<'info, TokenAccount>,

    pub creator: Signer<'info>,

    #[account(mut)]
    pub creator_pudl_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetParams<'info> {
    #[account(
        mut,
        seeds = [b"factory"],
        bump = factory.bump,
        constraint = factory.admin == admin.key()
    )]
    pub factory: Account<'info, Factory>,

    pub admin: Signer<'info>,
}

#[account]
pub struct Factory {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub router: Pubkey,
    pub bond_mint: Pubkey,
    pub bond_amount: u64,
    pub max_base_fee_bps: u16,
    pub min_base_fee_bps: u16,
    pub fee_scheduler_enabled: bool,
    pub total_pools: u64,
    pub bump: u8,
}

impl Factory {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 2 + 2 + 1 + 8 + 1;
}

#[account]
pub struct PoolMeta {
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub creator: Pubkey,
    pub base_fee_bps: u16,
    pub bin_step: u16,
    pub initial_price_x64: u128,
    pub pool_authority: Pubkey,
    pub bond_vault: Pubkey,
    pub created_at: i64,
    pub flags: u32,
    pub bump: u8,
}

impl PoolMeta {
    pub const LEN: usize = 32 + 32 + 32 + 2 + 2 + 16 + 32 + 32 + 8 + 4 + 1;
}

#[event]
pub struct FactoryInitialized {
    pub admin: Pubkey,
    pub bond_mint: Pubkey,
    pub bond_amount: u64,
}

#[event]
pub struct PoolCreated {
    pub pool: Pubkey,
    pub creator: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub fee_bps: u16,
    pub bin_step: u16,
}

#[event]
pub struct PoolClosed {
    pub pool: Pubkey,
    pub returned_bond: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient PUDL balance for pool creation")]
    InsufficientBond,
    #[msg("Fee outside allowed range")]
    InvalidFeeRange,
    #[msg("Pool already exists")]
    PoolAlreadyExists,
    #[msg("Pool is still active")]
    PoolStillActive,
    #[msg("Unauthorized")]
    Unauthorized,
}
