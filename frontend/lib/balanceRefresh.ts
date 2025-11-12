// Auto-refresh Balances
import { PublicKey, Connection } from '@solana/web3.js'

export class BalanceRefresher {
  private connection: Connection
  private subscriptions: Map<string, number> = new Map()
  private callbacks: Map<string, (balance: number) => void> = new Map()

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl)
  }

  async subscribeToBalance(
    walletAddress: string,
    tokenMint: string,
    callback: (balance: number) => void
  ) {
    const key = `${walletAddress}-${tokenMint}`
    this.callbacks.set(key, callback)

    // In production, use onAccountChange
    // const subscriptionId = this.connection.onAccountChange(
    //   new PublicKey(tokenAccount),
    //   (accountInfo) => {
    //     const balance = parseTokenBalance(accountInfo)
    //     callback(balance)
    //   }
    // )

    // Mock implementation - refresh every 10 seconds
    const intervalId = setInterval(async () => {
      const mockBalance = Math.random() * 1000
      callback(mockBalance)
    }, 10000) as unknown as number

    this.subscriptions.set(key, intervalId)
  }

  unsubscribe(walletAddress: string, tokenMint: string) {
    const key = `${walletAddress}-${tokenMint}`
    const intervalId = this.subscriptions.get(key)
    
    if (intervalId) {
      clearInterval(intervalId)
      this.subscriptions.delete(key)
      this.callbacks.delete(key)
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((intervalId) => clearInterval(intervalId))
    this.subscriptions.clear()
    this.callbacks.clear()
  }
}

export const balanceRefresher = new BalanceRefresher()
