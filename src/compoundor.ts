import { BigInt } from "@graphprotocol/graph-ts"
import {
  AutoCompounded,
  BalanceAdded,
  BalanceRemoved,
  TokenDeposited,
  TokenWithdrawn
} from "../generated/Compoundor/Compoundor"
import { Compound, AccountBalance, Token, CompoundSession } from "../generated/schema"

export function handleAutoCompounded(event: AutoCompounded): void {

  let token = Token.load(event.params.tokenId.toString())!
  token.compoundCount++
  token.compounded0 = token.compounded0.plus(event.params.amountAdded0)
  token.compounded1 = token.compounded1.plus(event.params.amountAdded1)
  token.save()

  let session = CompoundSession.load(token.currentSession!)!
  session.amountAdded0 = session.amountAdded0.plus(event.params.amountAdded0)
  session.amountAdded1 = session.amountAdded1.plus(event.params.amountAdded1)
  session.reward0 = session.reward0.plus(event.params.reward0)
  session.reward1 = session.reward1.plus(event.params.reward1)
  session.compoundCount++
  session.save()

  let compound = new Compound(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  compound.blockNumber = event.block.number
  compound.txHash = event.transaction.hash
  compound.timestamp = event.block.timestamp;
  compound.account = event.transaction.from;
  compound.tokenId = event.params.tokenId
  compound.amountAdded0 = event.params.amountAdded0
  compound.amountAdded1 = event.params.amountAdded1
  compound.reward0 = event.params.reward0
  compound.reward1 = event.params.reward1
  compound.token0 = event.params.token0
  compound.token1 = event.params.token1
  compound.isOwner = event.transaction.from.toHex() == token.account!.toHex()
  compound.session = session.id;
  compound.save()
}

export function handleBalanceAdded(event: BalanceAdded): void {
  let key = event.params.account.toHex() + "-" + event.params.token.toHex()
  let balance = AccountBalance.load(key)
  if (!balance) {
    balance = new AccountBalance(key)
    balance.balance = BigInt.fromI32(0)
    balance.token = event.params.token
    balance.account = event.params.account
  }
  balance.balance = balance.balance.plus(event.params.amount);
  balance.save();
}

export function handleBalanceRemoved(event: BalanceRemoved): void {
  let key = event.params.account.toHex() + "-" + event.params.token.toHex()
  let balance = AccountBalance.load(key)
  if (balance) {
    balance.balance = balance.balance.minus(event.params.amount);
    balance.save();
  }
}

export function handleTokenDeposited(event: TokenDeposited): void {
  let token = new Token(event.params.tokenId.toString())
  token.account = event.params.account
  token.compoundCount = 0
  token.compounded0 = BigInt.fromI32(0)
  token.compounded1 = BigInt.fromI32(0)
  token.save()

  let session = new CompoundSession(event.params.tokenId.toString() + "-" + event.transaction.hash.toHex() + "-" + event.transactionLogIndex.toString())
  session.startBlockNumber = event.block.number
  session.startTimestamp = event.block.timestamp
  session.account = event.params.account
  session.token = token.id
  session.compoundCount = 0
  session.amountAdded0 = BigInt.fromI32(0)
  session.amountAdded1 = BigInt.fromI32(0)
  session.reward0 = BigInt.fromI32(0)
  session.reward1 = BigInt.fromI32(0)
  session.save()

  token.currentSession = session.id;
  token.save()
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  let token = Token.load(event.params.tokenId.toString())!

  let session = CompoundSession.load(token.currentSession!)!
  session.endBlockNumber = event.block.number
  session.endTimestamp = event.block.timestamp;
  session.save()

  token.account = null
  token.currentSession = null
  token.compoundCount = 0
  token.compounded0 = BigInt.fromI32(0)
  token.compounded1 = BigInt.fromI32(0)
  token.save()  
}
