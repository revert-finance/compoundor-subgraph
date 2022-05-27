import { BigInt } from "@graphprotocol/graph-ts"
import {
  AutoCompounded,
  BalanceAdded,
  BalanceRemoved,
  TokenDeposited,
  TokenWithdrawn
} from "../generated/Compoundor/Compoundor"
import { Compound, AccountBalance, Token } from "../generated/schema"

export function handleAutoCompounded(event: AutoCompounded): void {
  let compound = new Compound(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  compound.account = event.transaction.from;
  compound.tokenId = event.params.tokenId
  compound.amountAdded0 = event.params.amountAdded0
  compound.amountAdded1 = event.params.amountAdded0
  compound.bonus0 = event.params.bonus0
  compound.bonus1 = event.params.bonus1
  compound.token0 = event.params.token0
  compound.token1 = event.params.token1
  compound.save()

  let token = Token.load(compound.tokenId.toString())!
  token.compoundCount++
  token.compounded0 = token.compounded0.plus(event.params.amountAdded0)
  token.compounded1 = token.compounded1.plus(event.params.amountAdded1)
  token.save()
}

export function handleBalanceAdded(event: BalanceAdded): void {
  let key = event.params.account.toHex() + "-" + event.params.token.toHex()
  let balance = AccountBalance.load(key)
  if (!balance) {
    balance = new AccountBalance(key)
  }
  balance.balance = balance.balance.plus(event.params.amount);
  balance.save();
}

export function handleBalanceRemoved(event: BalanceRemoved): void {
  let balance = new AccountBalance(event.params.account.toHex() + "-" + event.params.token.toHex())
  balance.balance = balance.balance.minus(event.params.amount);
  balance.save();
}

export function handleTokenDeposited(event: TokenDeposited): void {
  let token = new Token(event.params.tokenId.toString())
  token.account = event.params.account
  token.compoundCount = 0
  token.compounded0 = BigInt.fromI32(0)
  token.compounded1 = BigInt.fromI32(0)
  token.save()
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  let token = Token.load(event.params.tokenId.toString())!
  token.account = null
  token.compoundCount = 0
  token.compounded0 = BigInt.fromI32(0)
  token.compounded1 = BigInt.fromI32(0)
  token.save()
}
