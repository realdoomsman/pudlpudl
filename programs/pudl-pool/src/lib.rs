use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT");

#[program]
pub mod pudl_dlmm {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        base_fee_bps: u16,
        protocol_fee_bps: u16,
        bin_step: u16,
        active_bin_id: i32,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.factory = ctx.accounts.factory.key();
        pool.creator = ctx.accounts.creator.key();
        pool.base_mint = ctx.accounts.base_mint.key();
        pool.quote_mint = ctx.accounts.quote_mint.key();
        pool.base_vault = ctx.accounts.base_vault.key();
        pool.quote_vault = ctx.accounts.quote_vault.key();
        pool.base_fee_bps = base_fee_bps;
        pool.bin_step = bin_step;
        pool.active_bin_id = active_bin_id;
        pool.protocol_fee_bps = protocol_fee_bps;
        pool.total_volume = 0;
        pool.total_fees = 0;
        pool.paused = false;
        pool.bump = ctx.bumps.pool;

        Ok(())
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        bin_id: i32,
        base_amount: u64,
        quote_amount: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        require!(!pool.paused, ErrorCode::PoolPaused);

        if base_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_base_account.to_account_info(),
                        to: ctx.accounts.base_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                base_amount,
            )?;
        }

        if quote_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_quote_account.to_account_info(),
                        to: ctx.accounts.quote_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                quote_amount,
            )?;
        }

        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.user.key();
        position.pool = pool.key();
        position.lower_bin_id = bin_id;
        position.upper_bin_id = bin_id;
        position.base_amount += base_amount;
        position.quote_amount += quote_amount;
        position.fee_debt_base = 0;
        position.fee_debt_quote = 0;

        emit!(LiquidityAdded {
            pool: pool.key(),
            user: ctx.accounts.user.key(),
            bin_id,
            base_amount,
            quote_amount,
        });

        Ok(())
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        bps: u16,
    ) -> Result<()> {
        require!(bps <= 10000, ErrorCode::InvalidBps);

        let position = &mut ctx.accounts.position;
        let pool = &ctx.accounts.pool;

        let base_to_remove = (position.base_amount as u128 * bps as u128 / 10000) as u64;
        let quote_to_remove = (position.quote_amount as u128 * bps as u128 / 10000) as u64;

        let seeds = &[
            b"pool",
            pool.base_mint.as_ref(),
            pool.quote_mint.as_ref(),
            &pool.bin_step.to_le_bytes(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        if base_to_remove > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.base_vault.to_account_info(),
                        to: ctx.accounts.user_base_account.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer,
                ),
                base_to_remove,
            )?;
        }

        if quote_to_remove > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.quote_vault.to_account_info(),
                        to: ctx.accounts.user_quote_account.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer,
                ),
                quote_to_remove,
            )?;
        }

        position.base_amount -= base_to_remove;
        position.quote_amount -= quote_to_remove;

        emit!(LiquidityRemoved {
            pool: pool.key(),
            user: ctx.accounts.user.key(),
            base_amount: base_to_remove,
            quote_amount: quote_to_remove,
        });

        Ok(())
    }

    pub fn swap_exact_in(
        ctx: Context<Swap>,
        amount_in: u64,
        min_out: u64,
        swap_base_for_quote: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(!pool.paused, ErrorCode::PoolPaused);

        let effective_fee_bps = pool.base_fee_bps;
        
        let fee_amount = (amount_in as u128 * effective_fee_bps as u128 / 10000) as u64;
        let protocol_fee = (fee_amount as u128 * pool.protocol_fee_bps as u128 / 10000) as u64;
        let amount_after_fee = amount_in - fee_amount;
        
        let amount_out = calculate_swap_output(amount_after_fee);
        require!(amount_out >= min_out, ErrorCode::SlippageExceeded);

        if swap_base_for_quote {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_base_account.to_account_info(),
                        to: ctx.accounts.base_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            let seeds = &[
                b"pool",
                pool.base_mint.as_ref(),
                pool.quote_mint.as_ref(),
                &pool.bin_step.to_le_bytes(),
                &[pool.bump],
            ];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.quote_vault.to_account_info(),
                        to: ctx.accounts.user_quote_account.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer,
                ),
                amount_out,
            )?;
        } else {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_quote_account.to_account_info(),
                        to: ctx.accounts.quote_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                amount_in,
            )?;

            let seeds = &[
                b"pool",
                pool.base_mint.as_ref(),
                pool.quote_mint.as_ref(),
                &pool.bin_step.to_le_bytes(),
                &[pool.bump],
            ];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.base_vault.to_account_info(),
                        to: ctx.accounts.user_base_account.to_account_info(),
                        authority: pool.to_account_info(),
                    },
                    signer,
                ),
                amount_out,
            )?;
        }

        pool.total_volume += amount_in;
        pool.total_fees += fee_amount;

        emit!(SwapExecuted {
            pool: pool.key(),
            user: ctx.accounts.user.key(),
            in_mint: if swap_base_for_quote { pool.base_mint } else { pool.quote_mint },
            in_amount: amount_in,
            out_mint: if swap_base_for_quote { pool.quote_mint } else { pool.base_mint },
            out_amount: amount_out,
            fee_bps: effective_fee_bps,
            protocol_fee,
        });

        Ok(())
    }

    pub fn pause(ctx: Context<PausePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.paused = true;
        Ok(())
    }

    pub fn unpause(ctx: Context<PausePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.paused = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Pool::LEN,
        seeds = [b"pool", base_mint.key().as_ref(), quote_mint.key().as_ref(), &bin_step.to_le_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = creator,
        token::mint = base_mint,
        token::authority = pool,
        seeds = [b"base_vault", pool.key().as_ref()],
        bump
    )]
    pub base_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        token::mint = quote_mint,
        token::authority = pool,
        seeds = [b"quote_vault", pool.key().as_ref()],
        bump
    )]
    pub quote_vault: Account<'info, TokenAccount>,

    /// CHECK: Factory account
    pub factory: AccountInfo<'info>,

    pub base_mint: Account<'info, Mint>,
    pub quote_mint: Account<'info, Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.base_mint.as_ref(), pool.quote_mint.as_ref(), &pool.bin_step.to_le_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Position::LEN,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_base_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_quote_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub base_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub quote_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(
        seeds = [b"pool", pool.base_mint.as_ref(), pool.quote_mint.as_ref(), &pool.bin_step.to_le_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), user.key().as_ref()],
        bump,
        constraint = position.owner == user.key()
    )]
    pub position: Account<'info, Position>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_base_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_quote_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub base_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub quote_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.base_mint.as_ref(), pool.quote_mint.as_ref(), &pool.bin_step.to_le_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_base_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_quote_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub base_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub quote_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PausePool<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.base_mint.as_ref(), pool.quote_mint.as_ref(), &pool.bin_step.to_le_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: Admin authority
    pub admin: Signer<'info>,
}

#[account]
pub struct Pool {
    pub factory: Pubkey,
    pub creator: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub base_vault: Pubkey,
    pub quote_vault: Pubkey,
    pub base_fee_bps: u16,
    pub bin_step: u16,
    pub active_bin_id: i32,
    pub protocol_fee_bps: u16,
    pub total_volume: u64,
    pub total_fees: u64,
    pub paused: bool,
    pub bump: u8,
}

impl Pool {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 32 + 32 + 2 + 2 + 4 + 2 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub lower_bin_id: i32,
    pub upper_bin_id: i32,
    pub base_amount: u64,
    pub quote_amount: u64,
    pub fee_debt_base: u64,
    pub fee_debt_quote: u64,
}

impl Position {
    pub const LEN: usize = 32 + 32 + 4 + 4 + 8 + 8 + 8 + 8;
}

#[event]
pub struct LiquidityAdded {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub bin_id: i32,
    pub base_amount: u64,
    pub quote_amount: u64,
}

#[event]
pub struct LiquidityRemoved {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub base_amount: u64,
    pub quote_amount: u64,
}

#[event]
pub struct SwapExecuted {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub in_mint: Pubkey,
    pub in_amount: u64,
    pub out_mint: Pubkey,
    pub out_amount: u64,
    pub fee_bps: u16,
    pub protocol_fee: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Pool is paused")]
    PoolPaused,
    #[msg("Invalid bin range")]
    InvalidBinRange,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Invalid position")]
    InvalidPosition,
    #[msg("Invalid bps value")]
    InvalidBps,
}

fn calculate_swap_output(amount_in: u64) -> u64 {
    // Simplified constant product - real DLMM uses bin math
    (amount_in as u128 * 99 / 100) as u64
}
