import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import fs from "fs";

// Load IDLs
const factoryIdl = JSON.parse(fs.readFileSync("target/idl/pudl_factory.json", "utf8"));
const poolIdl = JSON.parse(fs.readFileSync("target/idl/pudl_dlmm.json", "utf8"));
const stakingIdl = JSON.parse(fs.readFileSync("target/idl/pudl_staking.json", "utf8"));
const treasuryIdl = JSON.parse(fs.readFileSync("target/idl/pudl_treasury.json", "utf8"));
const routerIdl = JSON.parse(fs.readFileSync("target/idl/pudl_router.json", "utf8"));
const governanceIdl = JSON.parse(fs.readFileSync("target/idl/pudl_governance.json", "utf8"));

async function main() {
  // Setup provider
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  console.log("🚀 Initializing PUDL Protocol...");
  console.log("Wallet:", wallet.publicKey.toBase58());
  console.log("Cluster:", connection.rpcEndpoint);

  // Load program IDs from Anchor.toml or keypairs
  const factoryProgramId = new PublicKey(fs.readFileSync("target/deploy/pudl_factory-keypair.json").toString());
  const poolProgramId = new PublicKey(fs.readFileSync("target/deploy/pudl_pool-keypair.json").toString());
  const stakingProgramId = new PublicKey(fs.readFileSync("target/deploy/pudl_staking-keypair.json").toString());
  const treasuryProgramId = new PublicKey(fs.readFileSync("target/deploy/pudl_treasury-keypair.json").toString());
  const routerProgramId = new PublicKey(fs.readFileSync("target/deploy/pudl_router-keypair.json").toString());
  const governanceProgramId = new PublicKey(fs.readFileSync("target/deploy/pudl_governance-keypair.json").toString());

  // Initialize programs
  const factoryProgram = new Program(factoryIdl, factoryProgramId, provider);
  const stakingProgram = new Program(stakingIdl, stakingProgramId, provider);
  const treasuryProgram = new Program(treasuryIdl, treasuryProgramId, provider);
  const routerProgram = new Program(routerIdl, routerProgramId, provider);
  const governanceProgram = new Program(governanceIdl, governanceProgramId, provider);

  // Step 1: Create $PUDL token
  console.log("\n📝 Step 1: Creating $PUDL token...");
  const pudlMint = await createMint(
    connection,
    wallet.payer,
    wallet.publicKey, // mint authority
    wallet.publicKey, // freeze authority
    6 // decimals
  );
  console.log("✅ $PUDL Mint:", pudlMint.toBase58());

  // Mint initial supply (1 billion tokens)
  const adminPudlAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    pudlMint,
    wallet.publicKey
  );
  
  await mintTo(
    connection,
    wallet.payer,
    pudlMint,
    adminPudlAccount.address,
    wallet.publicKey,
    1_000_000_000 * 1e6 // 1 billion tokens
  );
  console.log("✅ Minted 1B $PUDL to admin");

  // Step 2: Initialize Staking
  console.log("\n📝 Step 2: Initializing Staking...");
  const [stakingPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("staking")],
    stakingProgramId
  );

  const [stakingVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("staking_vault")],
    stakingProgramId
  );

  const [rewardsVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards_vault")],
    stakingProgramId
  );

  try {
    await stakingProgram.methods
      .initialize()
      .accounts({
        staking: stakingPda,
        pudlMint: pudlMint,
        stakingVault: stakingVault,
        rewardsVault: rewardsVault,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("✅ Staking initialized");
  } catch (e) {
    console.log("⚠️  Staking already initialized or error:", e.message);
  }

  // Step 3: Initialize Treasury
  console.log("\n📝 Step 3: Initializing Treasury...");
  const [treasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    treasuryProgramId
  );

  try {
    await treasuryProgram.methods
      .initialize()
      .accounts({
        treasury: treasuryPda,
        pudlMint: pudlMint,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Treasury initialized");
  } catch (e) {
    console.log("⚠️  Treasury already initialized or error:", e.message);
  }

  // Step 4: Initialize Router
  console.log("\n📝 Step 4: Initializing Router...");
  const [routerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("router")],
    routerProgramId
  );

  try {
    await routerProgram.methods
      .initialize(pudlMint)
      .accounts({
        router: routerPda,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Router initialized");
  } catch (e) {
    console.log("⚠️  Router already initialized or error:", e.message);
  }

  // Step 5: Initialize Governance
  console.log("\n📝 Step 5: Initializing Governance...");
  const [governancePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("governance")],
    governanceProgramId
  );

  try {
    await governanceProgram.methods
      .initialize(
        new BN(10_000 * 1e6), // 10k PUDL minimum quorum
        new BN(7 * 24 * 60 * 60), // 7 days voting period
        new BN(2 * 24 * 60 * 60)  // 2 days timelock
      )
      .accounts({
        governance: governancePda,
        stakingProgram: stakingProgramId,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Governance initialized");
  } catch (e) {
    console.log("⚠️  Governance already initialized or error:", e.message);
  }

  // Step 6: Initialize Factory
  console.log("\n📝 Step 6: Initializing Factory...");
  const [factoryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    factoryProgramId
  );

  try {
    await factoryProgram.methods
      .initializeFactory(
        new BN(1000 * 1e6), // 1000 PUDL bond requirement
        10,  // 0.1% min fee
        100  // 1% max fee
      )
      .accounts({
        factory: factoryPda,
        bondMint: pudlMint,
        treasury: treasuryPda,
        router: routerPda,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("✅ Factory initialized");
  } catch (e) {
    console.log("⚠️  Factory already initialized or error:", e.message);
  }

  // Step 7: Save configuration
  console.log("\n📝 Step 7: Saving configuration...");
  const config = {
    cluster: connection.rpcEndpoint,
    pudlMint: pudlMint.toBase58(),
    programs: {
      factory: factoryProgramId.toBase58(),
      pool: poolProgramId.toBase58(),
      staking: stakingProgramId.toBase58(),
      treasury: treasuryProgramId.toBase58(),
      router: routerProgramId.toBase58(),
      governance: governanceProgramId.toBase58(),
    },
    pdas: {
      factory: factoryPda.toBase58(),
      staking: stakingPda.toBase58(),
      treasury: treasuryPda.toBase58(),
      router: routerPda.toBase58(),
      governance: governancePda.toBase58(),
    },
    admin: wallet.publicKey.toBase58(),
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("deployment-config.json", JSON.stringify(config, null, 2));
  console.log("✅ Configuration saved to deployment-config.json");

  // Step 8: Update frontend env
  console.log("\n📝 Step 8: Generating frontend .env...");
  const envContent = `# Generated by initialize-programs.ts
# ${new Date().toISOString()}

NEXT_PUBLIC_RPC_URL=${connection.rpcEndpoint}
NEXT_PUBLIC_PUDL_MINT=${pudlMint.toBase58()}
NEXT_PUBLIC_FACTORY_PROGRAM=${factoryProgramId.toBase58()}
NEXT_PUBLIC_POOL_PROGRAM=${poolProgramId.toBase58()}
NEXT_PUBLIC_STAKING_PROGRAM=${stakingProgramId.toBase58()}
NEXT_PUBLIC_TREASURY_PROGRAM=${treasuryProgramId.toBase58()}
NEXT_PUBLIC_ROUTER_PROGRAM=${routerProgramId.toBase58()}
NEXT_PUBLIC_GOVERNANCE_PROGRAM=${governanceProgramId.toBase58()}
`;

  fs.writeFileSync("frontend/.env.local", envContent);
  console.log("✅ Frontend .env.local updated");

  console.log("\n🎉 PUDL Protocol initialization complete!");
  console.log("\n📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("$PUDL Mint:", pudlMint.toBase58());
  console.log("Factory:", factoryPda.toBase58());
  console.log("Staking:", stakingPda.toBase58());
  console.log("Treasury:", treasuryPda.toBase58());
  console.log("Router:", routerPda.toBase58());
  console.log("Governance:", governancePda.toBase58());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n✅ Next steps:");
  console.log("1. Create initial liquidity pools");
  console.log("2. Deploy frontend: cd frontend && vercel --prod");
  console.log("3. Test all functionality on devnet");
  console.log("4. Deploy to mainnet when ready");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
