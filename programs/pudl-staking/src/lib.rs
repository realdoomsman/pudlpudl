use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnU");

#[program]
pub mod pudl_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let staking = &mut ctx.accounts.staking;
        staking.authority = ctx.accounts.authority.key();
        staking.pudl_mint = ctx.accounts.pudl_mint.key();
        staking.staking_vault = ctx.accounts.staking_vault.key();
        staking.rewards_vault = ctx.accounts.rewards_vault.key();
        staking.total_staked = 0;
        staking.reward_index_x64 = 0;
        staking.last_update = Clock::get()?.unix_timestamp;
        staking.bump = ctx.bumps.staking;
        Ok(())
    }

    pub fn stake_pudl(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let staking = &mut ctx.accounts.staking;
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_pudl_account.to_account_info(),
                    to: ctx.accounts.staking_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.owner = ctx.accounts.user.key();
        stake_account.amount += amount;
        stake_account.reward_debt_x64 = (stake_account.amount as u128)
            .checked_mul(staking.reward_index_x64)
            .unwrap();
        stake_account.tier = calculate_tier(stake_account.amount);
        stake_account.last_update = Clock::get()?.unix_timestamp;

        staking.total_staked += amount;

        emit!(Staked {
            user: ctx.accounts.user.key(),
            amount,
            new_tier: stake_account.tier,
        });

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let staking = &ctx.accounts.staking;
        
        let pending = ((stake_account.amount as u128)
            .checked_mul(staking.reward_index_x64)
            .unwrap()
            .checked_sub(stake_account.reward_debt_x64)
            .unwrap()) >> 64;

        if pending > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.reward_vault.to_account_info(),
                        to: ctx.accounts.user_pudl_account.to_account_info(),
                        authority: staking.to_account_info(),
                    },
                    &[&[b"staking", &[staking.bump]]],
                ),
                pending as u64,
            )?;

            stake_account.reward_debt_x64 = (stake_account.amount as u128)
                .checked_mul(staking.reward_index_x64)
                .unwrap();

            emit!(RewardsClaimed {
                user: ctx.accounts.user.key(),
                amount: pending as u64,
            });
        }

        Ok(())
    }

    pub fn unstake_pudl(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let staking = &mut ctx.accounts.staking;

        require!(stake_account.amount >= amount, ErrorCode::InsufficientStake);

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.staking_vault.to_account_info(),
                    to: ctx.accounts.user_pudl_account.to_account_info(),
                    authority: staking.to_account_info(),
                },
                &[&[b"staking", &[staking.bump]]],
            ),
            amount,
        )?;

        stake_account.amount -= amount;
        stake_account.tier = calculate_tier(stake_account.amount);
        stake_account.reward_debt_x64 = (stake_account.amount as u128)
            .checked_mul(staking.reward_index_x64)
            .unwrap();
        staking.total_staked -= amount;

        emit!(Unstaked {
            user: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    pub fn sync_rewards(ctx: Context<SyncRewards>, new_rewards: u64) -> Result<()> {
        let staking = &mut ctx.accounts.staking;
        
        if staking.total_staked > 0 {
            let reward_per_token = ((new_rewards as u128) << 64) / staking.total_staked as u128;
            staking.reward_index_x64 = staking.reward_index_x64
                .checked_add(reward_per_token)
                .unwrap();
        }

        staking.last_update = Clock::get()?.unix_timestamp;

        emit!(RewardsSynced {
            new_rewards,
            new_index: staking.reward_index_x64,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Staking::LEN,
        seeds = [b"staking"],
        bump
    )]
    pub staking: Account<'info, Staking>,

    /// CHECK: PUDL mint
    pub pudl_mint: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"staking"],
        bump
    )]
    pub staking: Account<'info, Staking>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::LEN,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_pudl_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub staking_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        seeds = [b"staking"],
        bump
    )]
    pub staking: Account<'info, Staking>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_pudl_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"staking"],
        bump
    )]
    pub staking: Account<'info, Staking>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_pudl_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub staking_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Staking {
    pub authority: Pubkey,
    pub pudl_mint: Pubkey,
    pub staking_vault: Pubkey,
    pub rewards_vault: Pubkey,
    pub total_staked: u64,
    pub reward_index_x64: u128,
    pub last_update: i64,
    pub bump: u8,
}

impl Staking {
    pub const LEN: usize = 32 + 32 + 32 + 32 + 8 + 16 + 8 + 1;
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub reward_debt_x64: u128,
    pub tier: u8,
    pub last_update: i64,
}

impl StakeAccount {
    pub const LEN: usize = 32 + 8 + 16 + 1 + 8;
}

pub fn calculate_tier(amount: u64) -> u8 {
    let amount_tokens = amount / 1_000_000; // Assuming 6 decimals
    if amount_tokens >= 100_000 {
        3
    } else if amount_tokens >= 10_000 {
        2
    } else if amount_tokens >= 1_000 {
        1
    } else {
        0
    }
}

#[derive(Accounts)]
pub struct SyncRewards<'info> {
    #[account(
        mut,
        seeds = [b"staking"],
        bump = staking.bump
    )]
    pub staking: Account<'info, Staking>,

    /// CHECK: Treasury authority
    pub treasury: Signer<'info>,
}

#[event]
pub struct Staked {
    pub user: Pubkey,
    pub amount: u64,
    pub new_tier: u8,
}

#[event]
pub struct Unstaked {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsClaimed {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsSynced {
    pub new_rewards: u64,
    pub new_index: u128,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient staked amount")]
    InsufficientStake,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
}
