use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnX");

#[program]
pub mod pudl_governance {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        min_quorum: u64,
        voting_period: i64,
        timelock_period: i64,
    ) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.authority = ctx.accounts.authority.key();
        governance.staking_program = ctx.accounts.staking_program.key();
        governance.min_quorum = min_quorum;
        governance.voting_period = voting_period;
        governance.timelock_period = timelock_period;
        governance.proposal_count = 0;
        governance.bump = ctx.bumps.governance;
        Ok(())
    }

    pub fn propose(
        ctx: Context<Propose>,
        target_program: Pubkey,
        action_data: Vec<u8>,
    ) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        let proposal = &mut ctx.accounts.proposal;

        let current_time = Clock::get()?.unix_timestamp;

        proposal.id = governance.proposal_count;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.target_program = target_program;
        proposal.action_data = action_data;
        proposal.start_time = current_time;
        proposal.end_time = current_time + governance.voting_period;
        proposal.execute_time = proposal.end_time + governance.timelock_period;
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.executed = false;
        proposal.bump = ctx.bumps.proposal;

        governance.proposal_count += 1;

        emit!(Proposed {
            id: proposal.id,
            proposer: proposal.proposer,
            target: target_program,
        });

        Ok(())
    }

    pub fn vote(
        ctx: Context<Vote>,
        support: bool,
        weight: u64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            current_time >= proposal.start_time && current_time <= proposal.end_time,
            ErrorCode::ProposalNotActive
        );

        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.proposal = proposal.key();
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.weight = weight;
        vote_record.support = support;

        if support {
            proposal.votes_for += weight;
        } else {
            proposal.votes_against += weight;
        }

        emit!(Voted {
            proposal: proposal.key(),
            voter: ctx.accounts.voter.key(),
            weight,
            support,
        });

        Ok(())
    }

    pub fn execute(ctx: Context<Execute>) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        let governance = &ctx.accounts.governance;
        let current_time = Clock::get()?.unix_timestamp;

        require!(current_time >= proposal.execute_time, ErrorCode::TimelockNotElapsed);
        require!(proposal.votes_for >= governance.min_quorum, ErrorCode::QuorumNotMet);
        require!(!proposal.executed, ErrorCode::AlreadyExecuted);

        // In production, deserialize and execute action_data via CPI

        let proposal_mut = &mut ctx.accounts.proposal;
        proposal_mut.executed = true;

        emit!(Executed {
            proposal: proposal.key(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Governance::LEN,
        seeds = [b"governance"],
        bump
    )]
    pub governance: Account<'info, Governance>,

    /// CHECK: Staking program
    pub staking_program: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Propose<'info> {
    #[account(
        mut,
        seeds = [b"governance"],
        bump = governance.bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::MAX_LEN,
        seeds = [b"proposal", &governance.proposal_count.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(
        mut,
        seeds = [b"proposal", &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::LEN,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Execute<'info> {
    #[account(seeds = [b"governance"], bump = governance.bump)]
    pub governance: Account<'info, Governance>,

    #[account(
        mut,
        seeds = [b"proposal", &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub executor: Signer<'info>,
}

#[account]
pub struct Governance {
    pub authority: Pubkey,
    pub staking_program: Pubkey,
    pub min_quorum: u64,
    pub voting_period: i64,
    pub timelock_period: i64,
    pub proposal_count: u64,
    pub bump: u8,
}

impl Governance {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub target_program: Pubkey,
    pub action_data: Vec<u8>,
    pub start_time: i64,
    pub end_time: i64,
    pub execute_time: i64,
    pub votes_for: u64,
    pub votes_against: u64,
    pub executed: bool,
    pub bump: u8,
}

impl Proposal {
    pub const MAX_LEN: usize = 8 + 32 + 32 + 4 + 256 + 8 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct VoteRecord {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub weight: u64,
    pub support: bool,
}

impl VoteRecord {
    pub const LEN: usize = 32 + 32 + 8 + 1;
}

#[event]
pub struct Proposed {
    pub id: u64,
    pub proposer: Pubkey,
    pub target: Pubkey,
}

#[event]
pub struct Voted {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub weight: u64,
    pub support: bool,
}

#[event]
pub struct Executed {
    pub proposal: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Proposal not in voting period")]
    ProposalNotActive,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Quorum not met")]
    QuorumNotMet,
    #[msg("Timelock not elapsed")]
    TimelockNotElapsed,
    #[msg("Already executed")]
    AlreadyExecuted,
}
