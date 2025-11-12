import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

async function main() {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log('🚀 Deploying PudlPudl Protocol...\n');

  // Load programs
  const factoryProgram = anchor.workspace.PudlFactory;
  const dlmmProgram = anchor.workspace.PudlDlmm;
  const treasuryProgram = anchor.workspace.PudlTreasury;
  const stakingProgram = anchor.workspace.PudlStaking;
  const routerProgram = anchor.workspace.PudlRouter;
  const governanceProgram = anchor.workspace.PudlGovernance;

  console.log('📝 Program IDs:');
  console.log('Factory:', factoryProgram.programId.toString());
  console.log('DLMM:', dlmmProgram.programId.toString());
  console.log('Treasury:', treasuryProgram.programId.toString());
  console.log('Staking:', stakingProgram.programId.toString());
  console.log('Router:', routerProgram.programId.toString());
  console.log('Governance:', governanceProgram.programId.toString());
  console.log();

  // Create $PUDL token mint
  console.log('💎 Creating $PUDL token...');
  const pudlMint = await createMint(
    provider.connection,
    provider.wallet.payer,
    provider.wallet.publicKey,
    null,
    6 // 6 decimals
  );
  console.log('$PUDL Mint:', pudlMint.toString());
  console.log();

  // Initialize Treasury
  console.log('🏦 Initializing Treasury...');
  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    treasuryProgram.programId
  );

  await treasuryProgram.methods
    .initialize()
    .accounts({
      treasury,
      pudlMint,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log('Treasury initialized:', treasury.toString());
  console.log();

  // Initialize Router
  console.log('🔀 Initializing Router...');
  const [router] = PublicKey.findProgramAddressSync(
    [Buffer.from('router')],
    routerProgram.programId
  );

  await routerProgram.methods
    .initialize(pudlMint)
    .accounts({
      router,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log('Router initialized:', router.toString());
  console.log();

  // Initialize Factory
  console.log('🏭 Initializing Factory...');
  const [factory] = PublicKey.findProgramAddressSync(
    [Buffer.from('factory')],
    factoryProgram.programId
  );

  const bondAmount = new anchor.BN(1000 * 1_000_000); // 1000 PUDL
  const minFeeBps = 5; // 0.05%
  const maxFeeBps = 100; // 1.00%

  await factoryProgram.methods
    .initializeFactory(bondAmount, minFeeBps, maxFeeBps)
    .accounts({
      factory,
      bondMint: pudlMint,
      treasury,
      router,
      admin: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log('Factory initialized:', factory.toString());
  console.log('Bond amount:', bondAmount.toString(), 'PUDL');
  console.log('Fee range:', minFeeBps, '-', maxFeeBps, 'bps');
  console.log();

  // Initialize Staking
  console.log('💰 Initializing Staking...');
  const [staking] = PublicKey.findProgramAddressSync(
    [Buffer.from('staking')],
    stakingProgram.programId
  );

  // Create staking and rewards vaults
  const stakingVault = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    pudlMint,
    staking,
    true
  );

  const rewardsVault = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    pudlMint,
    staking,
    true
  );

  await stakingProgram.methods
    .initialize()
    .accounts({
      staking,
      pudlMint,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log('Staking initialized:', staking.toString());
  console.log('Staking vault:', stakingVault.address.toString());
  console.log('Rewards vault:', rewardsVault.address.toString());
  console.log();

  // Initialize Governance
  console.log('🗳️  Initializing Governance...');
  const [governance] = PublicKey.findProgramAddressSync(
    [Buffer.from('governance')],
    governanceProgram.programId
  );

  const minQuorum = new anchor.BN(10000 * 1_000_000); // 10k PUDL
  const votingPeriod = new anchor.BN(3 * 24 * 60 * 60); // 3 days
  const timelockPeriod = new anchor.BN(2 * 24 * 60 * 60); // 2 days

  await governanceProgram.methods
    .initialize(minQuorum, votingPeriod, timelockPeriod)
    .accounts({
      governance,
      stakingProgram: stakingProgram.programId,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log('Governance initialized:', governance.toString());
  console.log('Min quorum:', minQuorum.toString(), 'PUDL');
  console.log('Voting period:', votingPeriod.toString(), 'seconds');
  console.log('Timelock:', timelockPeriod.toString(), 'seconds');
  console.log();

  console.log('✅ Deployment complete!\n');
  console.log('📋 Summary:');
  console.log('$PUDL Mint:', pudlMint.toString());
  console.log('Factory:', factory.toString());
  console.log('Treasury:', treasury.toString());
  console.log('Staking:', staking.toString());
  console.log('Router:', router.toString());
  console.log('Governance:', governance.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
