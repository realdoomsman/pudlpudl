// Mock data for testing before smart contracts are deployed

export const mockPools = [
  {
    address: "Pool1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    base_mint: "SOL",
    quote_mint: "USDC",
    creator: "Creator1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    fee_bps: 20,
    bin_step: 10,
    tvl_usd: 125000,
    volume_24h: 45000,
    fee_apr_24h: 12.5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    address: "Pool2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    base_mint: "PUDL",
    quote_mint: "SOL",
    creator: "Creator2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    fee_bps: 15,
    bin_step: 10,
    tvl_usd: 89000,
    volume_24h: 32000,
    fee_apr_24h: 15.2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    address: "Pool3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    base_mint: "USDC",
    quote_mint: "USDT",
    creator: "Creator3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    fee_bps: 10,
    bin_step: 5,
    tvl_usd: 250000,
    volume_24h: 78000,
    fee_apr_24h: 8.7,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const mockStakingStats = {
  totalStaked: 5420000,
  stakerCount: 1247,
  apr: "18.5",
  weeklyRewards: 12500,
};

export const mockUserStake = {
  amount: 10000,
  tier: 2,
  pendingRewards: 125.5,
  updated_at: new Date().toISOString(),
};

export const mockSwapRate = 0.99;

export const mockProtocolStats = {
  tvl: 464000,
  volume24h: 155000,
  totalPools: 3,
  totalStakers: 1247,
};
