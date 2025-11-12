# Implementation Plan

- [ ] 1. Set up project structure and core dependencies
  - Initialize Anchor workspace with 6 programs (factory, dlmm, treasury, router, staking, governance)
  - Configure Anchor.toml with program IDs and cluster settings
  - Set up shared types and constants module
  - Create package.json with Solana and Anchor dependencies
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement Factory Contract (P1) core functionality
- [ ] 2.1 Create Factory state structures and PDAs
  - Define Factory and PoolMeta account structures
  - Implement PDA derivation functions for Factory, Pool, and PoolBondVault
  - Add validation helpers for fee bounds
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Implement initialize_factory instruction
  - Create instruction handler with admin, treasury, router, bond_mint parameters
  - Initialize Factory PDA with protocol parameters
  - Emit FactoryInitialized event
  - _Requirements: 1.1_

- [ ] 2.3 Implement create_pool instruction
  - Validate fee_bps within min/max bounds
  - Check pool uniqueness (base, quote, bin_step)
  - Transfer bond_amount $PUDL to PoolBondVault
  - Create PoolMeta PDA
  - Emit PoolCreated event
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.4 Implement close_pool instruction
  - Check TVL threshold and cooldown period
  - Return bonded $PUDL to creator or slash if flagged
  - Mark pool as inactive
  - Emit PoolClosed event
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 2.5 Implement set_params instruction
  - Add governance access control
  - Validate new parameter values
  - Update Factory state
  - Emit ParamsUpdated event
  - _Requirements: 9.5_

- [ ]* 2.6 Write unit tests for Factory contract
  - Test pool creation with valid/invalid parameters
  - Test bond transfer and vault creation
  - Test pool closure scenarios
  - Test parameter updates
  - _Requirements: 1.1-1.5, 8.1-8.6_

- [ ] 3. Implement DLMM Pool Contract (P4) core functionality
- [ ] 3.1 Create DLMM state structures
  - Define Pool, Position, and Bin account structures
  - Implement bin math helper functions (price calculation, liquidity)
  - Add PDA derivation for pools and positions
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.2 Implement initialize_pool instruction
  - Create pool state with vaults
  - Initialize active bin
  - Set up fee parameters
  - _Requirements: 2.1_

- [ ] 3.3 Implement add_liquidity instruction
  - Validate bin ranges
  - Transfer base and quote tokens to vaults
  - Update Position and Bin states
  - Calculate and assign liquidity shares
  - Emit LiquidityAdded event
  - _Requirements: 2.1, 2.2, 2.3, 2.4_


- [ ] 3.4 Implement remove_liquidity instruction
  - Calculate shares to remove based on bps
  - Claim accrued fees for user
  - Transfer tokens back to user
  - Update Position and Bin states
  - Emit LiquidityRemoved event
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.5 Implement swap_exact_in instruction
  - Calculate effective fee (with tier discount check)
  - Traverse bins to fill order
  - Split fees between LP and protocol portions
  - Transfer tokens between user and vaults
  - Emit Swap event
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 3.6 Implement pause/unpause instructions
  - Add admin access control
  - Set paused flag in pool state
  - Block swaps and add_liquidity when paused
  - Allow remove_liquidity for fund recovery
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ]* 3.7 Write unit tests for DLMM contract
  - Test liquidity operations across bins
  - Test swap calculations and fee splits
  - Test tier-based discounts
  - Test pause functionality
  - _Requirements: 2.1-2.4, 3.1-3.6, 10.1-10.5, 11.1-11.4_

- [ ] 4. Implement Treasury Contract (P3) for fee management
- [ ] 4.1 Create Treasury state structures and PDAs
  - Define Treasury account structure
  - Implement PDA derivation for Treasury, FeeVaults, RewardsVault
  - Add split validation helper (sum = 10000)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.2 Implement record_fee instruction
  - Accept fee transfers from DLMM pools
  - Transfer tokens to appropriate FeeVault[mint]
  - Update accounting counters
  - Emit FeeRecorded event
  - _Requirements: 3.5, 4.1_

- [ ] 4.3 Implement harvest_and_convert instruction with Jupiter integration
  - Iterate through FeeVault accounts
  - For non-$PUDL vaults, execute Jupiter CPI swap to $PUDL
  - Calculate split amounts (burn, stakers, ops)
  - Execute burn operation
  - Transfer to RewardsVault and ops wallet
  - Emit Harvested event
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 4.4 Implement set_split instruction
  - Add governance access control
  - Validate split bps sum to 10000
  - Update Treasury split parameters
  - _Requirements: 9.5_

- [ ]* 4.5 Write unit tests for Treasury contract
  - Test fee recording from multiple pools
  - Mock Jupiter CPI and test split calculations
  - Test reward sync to Staking
  - Test edge cases (empty vaults, failed swaps)
  - _Requirements: 4.1-4.7_

- [ ] 5. Implement Staking Contract (P5) for $PUDL staking
- [ ] 5.1 Create Staking state structures and PDAs
  - Define Staking and UserStake account structures
  - Implement PDA derivation for Staking and UserStake
  - Add tier calculation helper function
  - Add reward math helpers (fixed-point arithmetic)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.2 Implement stake_pudl instruction
  - Transfer $PUDL from user to staking_vault
  - Create or update UserStake PDA
  - Calculate and assign tier based on amount
  - Update reward_debt_x64 = amount * reward_index_x64
  - Emit Staked event
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.3 Implement claim_rewards instruction
  - Calculate pending rewards: (amount * index - debt) / 2^64
  - Transfer rewards from RewardsVault to user
  - Update reward_debt_x64 to current value
  - Emit RewardClaimed event
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 5.4 Implement unstake_pudl instruction
  - Claim pending rewards first
  - Transfer $PUDL from vault to user
  - Update UserStake amount and recalculate tier
  - Emit Unstaked event
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.5 Implement sync_rewards instruction
  - Accept new_rewards parameter from Treasury
  - Update reward_index_x64 += (new_rewards * 2^64) / total_staked
  - Emit RewardsSynced event
  - _Requirements: 4.6_

- [ ]* 5.6 Write unit tests for Staking contract
  - Test stake/unstake flows
  - Test reward calculation accuracy
  - Test tier transitions
  - Test concurrent claims
  - _Requirements: 5.1-5.5, 6.1-6.4_

- [ ] 6. Implement Router Contract (P2) for optimal swap routing
- [ ] 6.1 Create Router state and pool registry
  - Define pool registry data structure
  - Implement path scoring algorithm
  - Add $PUDL pair detection logic
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6.2 Implement swap_exact_in instruction
  - Validate path (max 3 hops)
  - Execute swaps via CPI to DLMM pools
  - Verify final output >= min_out
  - Emit SwapRouted event
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 6.3 Implement register_pool and deregister_pool instructions
  - Add Factory-only access control
  - Update internal pool registry
  - _Requirements: 7.1_

- [ ]* 6.4 Write unit tests for Router contract
  - Test single-hop vs multi-hop routing
  - Test $PUDL pair preference
  - Test slippage protection
  - _Requirements: 7.1-7.6_

- [ ] 7. Implement Governance Contract (P6) for protocol governance
- [ ] 7.1 Create Governance state structures and PDAs
  - Define Governance, Proposal, and Vote account structures
  - Implement PDA derivation functions
  - Add quorum and timelock validation helpers
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 7.2 Implement propose instruction
  - Check proposer has minimum stake threshold
  - Create Proposal PDA with action data
  - Set voting period timestamps
  - Emit Proposed event
  - _Requirements: 9.1, 9.2_

- [ ] 7.3 Implement vote instruction
  - Read voter's staked balance from Staking contract via CPI
  - Create Vote PDA with weight
  - Update proposal vote counts
  - Emit Voted event
  - _Requirements: 9.3, 9.4_

- [ ] 7.4 Implement execute instruction
  - Verify voting ended, quorum met, timelock elapsed
  - Deserialize action_data
  - Execute CPI to target program
  - Mark proposal as executed
  - Emit Executed event
  - _Requirements: 9.5, 9.6_

- [ ]* 7.5 Write unit tests for Governance contract
  - Test proposal lifecycle
  - Test vote weight calculation
  - Test timelock enforcement
  - Test execution CPI
  - _Requirements: 9.1-9.6_

- [ ] 8. Wire up cross-program integrations
- [ ] 8.1 Connect Factory to DLMM pool initialization
  - Add CPI from Factory::create_pool to DLMM::initialize_pool
  - Pass pool parameters correctly
  - Handle CPI errors
  - _Requirements: 1.4_

- [ ] 8.2 Connect DLMM to Treasury fee recording
  - Add CPI from DLMM::swap to Treasury::record_fee
  - Calculate protocol fee portion
  - Handle recording failures gracefully
  - _Requirements: 3.5_

- [ ] 8.3 Connect Treasury to Staking reward sync
  - Add CPI from Treasury::harvest_and_convert to Staking::sync_rewards
  - Pass calculated reward amounts
  - _Requirements: 4.6_

- [ ] 8.4 Connect DLMM to Staking tier lookup
  - Add CPI from DLMM::swap to read UserStake tier
  - Apply fee discount based on tier
  - Handle case where user has no stake
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 8.5 Connect Governance to target programs
  - Implement CPI execution for Factory::set_params
  - Implement CPI execution for Treasury::set_split
  - Implement CPI execution for DLMM::pause/unpause
  - _Requirements: 9.5, 9.6_

- [ ]* 8.6 Write integration tests for cross-program flows
  - Test end-to-end pool creation → swap → fee recording
  - Test harvest → buyback → reward distribution
  - Test stake → swap with discount
  - Test governance proposal → execution
  - _Requirements: All cross-program requirements_

- [ ] 9. Deploy and configure $PUDL SPL token
  - Create $PUDL token mint with appropriate decimals (6 or 9)
  - Set mint authority to governance multisig
  - Mint initial supply for treasury, liquidity, team
  - Create token metadata (name, symbol, logo)
  - _Requirements: All requirements depend on $PUDL token_

- [ ] 10. Set up backend indexer service
- [ ] 10.1 Create database schema and migrations
  - Implement PostgreSQL schema for tokens, pools, pool_stats, swaps, fees, buybacks, stakes
  - Create indexes for query optimization
  - Write migration scripts
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 10.2 Implement event listener and parser
  - Set up Helius webhook or WebSocket connection
  - Parse program logs for events (PoolCreated, SwapExecuted, etc.)
  - Deserialize event data
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 10.3 Implement event handlers and database writes
  - Handle PoolCreated → insert into pools table
  - Handle SwapExecuted → insert into swaps, update pool_stats
  - Handle LiquidityAdded/Removed → recalculate TVL
  - Handle Harvested → insert into buybacks
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 10.4 Create REST API endpoints
  - GET /api/pools - list all pools with filters
  - GET /api/pools/:address - pool details and stats
  - GET /api/staking/stats - staking statistics
  - GET /api/governance/proposals - list proposals
  - Implement response caching
  - _Requirements: 12.5_

- [ ]* 10.5 Write tests for indexer service
  - Test event parsing accuracy
  - Test database write operations
  - Test API endpoint responses
  - Test performance under load
  - _Requirements: 12.1-12.5_

- [ ] 11. Build frontend pool creation interface
- [ ] 11.1 Create pool creation wizard component
  - Token selection dropdowns (base and quote)
  - Fee slider with min/max bounds
  - Bin step selector with presets
  - Initial price input with helper
  - $PUDL bond requirement display
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 11.2 Implement pool creation transaction flow
  - Check user $PUDL balance
  - Build and send create_pool transaction
  - Handle transaction confirmation
  - Display success/error messages
  - Redirect to pool page on success
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 11.3 Write component tests for pool creation
  - Test form validation
  - Test balance checks
  - Test transaction building
  - _Requirements: 1.1-1.5_

- [ ] 12. Build frontend pool detail and liquidity interface
- [ ] 12.1 Create pool detail page component
  - Display pool metadata (tokens, fee, bin step)
  - Show TVL, volume, APR charts
  - List user positions
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 12.2 Implement add liquidity modal
  - Bin range selector
  - Token amount inputs
  - Preview liquidity distribution
  - Build and send add_liquidity transaction
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 12.3 Implement remove liquidity modal
  - Display user positions
  - Percentage slider for removal
  - Show expected token amounts
  - Build and send remove_liquidity transaction
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 12.4 Write component tests for liquidity interface
  - Test add/remove flows
  - Test amount calculations
  - _Requirements: 2.1-2.4_

- [ ] 13. Build frontend swap interface
- [ ] 13.1 Create swap component
  - Token input/output fields
  - Slippage tolerance setting
  - Route display (single or multi-hop)
  - Price impact warning
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 13.2 Implement swap transaction flow
  - Fetch optimal route from Router or API
  - Build swap transaction
  - Handle transaction confirmation
  - Display swap result
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 13.3 Write component tests for swap interface
  - Test input validation
  - Test route calculation
  - Test slippage checks
  - _Requirements: 3.1-3.6, 7.1-7.6_

- [ ] 14. Build frontend staking interface
- [ ] 14.1 Create staking dashboard component
  - Display total staked, user stake, tier
  - Show APR and pending rewards
  - Display tier benefits (fee discounts)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 14.2 Implement stake/unstake modals
  - Amount input with balance check
  - Tier preview after stake
  - Build and send stake/unstake transactions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14.3 Implement claim rewards button
  - Display pending rewards
  - Build and send claim_rewards transaction
  - Update UI after claim
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 14.4 Write component tests for staking interface
  - Test stake/unstake flows
  - Test reward calculations
  - Test tier display
  - _Requirements: 5.1-5.5, 6.1-6.4_

- [ ] 15. Build frontend governance interface
- [ ] 15.1 Create proposals list component
  - Display active and past proposals
  - Show vote counts and status
  - Filter by status (active, passed, failed)
  - _Requirements: 9.1, 9.2_

- [ ] 15.2 Implement proposal detail and voting
  - Display proposal details and action
  - Show user's voting power
  - Vote buttons (for/against)
  - Build and send vote transaction
  - _Requirements: 9.3, 9.4_

- [ ] 15.3 Implement proposal creation form
  - Template selection (change params, etc.)
  - Parameter inputs
  - Build and send propose transaction
  - _Requirements: 9.1, 9.2_

- [ ]* 15.4 Write component tests for governance interface
  - Test proposal display
  - Test voting flow
  - Test proposal creation
  - _Requirements: 9.1-9.6_

- [ ] 16. Set up keeper service for automated operations
- [ ] 16.1 Create keeper script for harvest_and_convert
  - Check Treasury vault balances
  - Call harvest_and_convert when threshold met
  - Handle transaction failures and retries
  - Log operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 16.2 Set up cron job or scheduled task
  - Configure execution interval (e.g., every 15 minutes)
  - Set up monitoring and alerts
  - _Requirements: 4.1_

- [ ] 17. Deploy to devnet and run integration tests
  - Deploy all programs to devnet
  - Deploy test $PUDL token
  - Create test pools
  - Run end-to-end test scenarios
  - Fix bugs and iterate
  - _Requirements: All requirements_

- [ ] 18. Security audit preparation
  - Document all program functions and access controls
  - Create test vectors for critical math operations
  - Run fuzzing tests on contracts
  - Prepare audit report template
  - _Requirements: All requirements_

- [ ] 19. Deploy to testnet for public testing
  - Deploy programs with production-like parameters
  - Set up monitoring and alerting
  - Launch public testing campaign
  - Collect feedback and fix issues
  - _Requirements: All requirements_

- [ ] 20. Mainnet deployment and launch
  - Deploy programs to mainnet
  - Deploy production $PUDL token
  - Set up governance multisig
  - Configure initial parameters
  - Launch with guarded limits
  - Monitor and gradually open access
  - _Requirements: All requirements_
