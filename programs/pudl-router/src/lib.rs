use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnW");

#[program]
pub mod pudl_router {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, pudl_mint: Pubkey) -> Result<()> {
        let router = &mut ctx.accounts.router;
        router.authority = ctx.accounts.authority.key();
        router.pudl_mint = pudl_mint;
        router.pudl_weight_bonus = 100; // 1% bonus for PUDL pairs
        router.max_hops = 3;
        router.bump = ctx.bumps.router;
        Ok(())
    }

    pub fn register_pool(ctx: Context<RegisterPool>, pool: Pubkey) -> Result<()> {
        // In production, maintain a pool registry
        emit!(PoolRegistered { pool });
        Ok(())
    }

    pub fn swap_exact_in(
        ctx: Context<SwapExactIn>,
        amount_in: u64,
        min_out: u64,
    ) -> Result<()> {
        // Simplified - in production, this would:
        // 1. Query available pools
        // 2. Calculate optimal path
        // 3. Execute swaps via CPI to DLMM pools
        // 4. Apply PUDL pair preference

        emit!(SwapRouted {
            user: ctx.accounts.user.key(),
            amount_in,
            amount_out: min_out,
            hops: 1,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Router::LEN,
        seeds = [b"router"],
        bump
    )]
    pub router: Account<'info, Router>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterPool<'info> {
    #[account(seeds = [b"router"], bump = router.bump)]
    pub router: Account<'info, Router>,

    /// CHECK: Factory authority
    pub factory: Signer<'info>,
}

#[derive(Accounts)]
pub struct SwapExactIn<'info> {
    #[account(seeds = [b"router"], bump = router.bump)]
    pub router: Account<'info, Router>,

    pub user: Signer<'info>,
}

#[account]
pub struct Router {
    pub authority: Pubkey,
    pub pudl_mint: Pubkey,
    pub pudl_weight_bonus: u16,
    pub max_hops: u8,
    pub bump: u8,
}

impl Router {
    pub const LEN: usize = 32 + 32 + 2 + 1 + 1;
}

#[event]
pub struct PoolRegistered {
    pub pool: Pubkey,
}

#[event]
pub struct SwapRouted {
    pub user: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub hops: u8,
}
