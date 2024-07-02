import { BigInt, Address, dataSource } from "@graphprotocol/graph-ts"
import {
  AutoCompounded,
  BalanceAdded,
  BalanceRemoved,
  TokenDeposited,
  TokenWithdrawn
} from "../generated/Compoundor/Compoundor"
import {
  Approval
} from "../generated/NonfungiblePositionManager/NonfungiblePositionManager"
import {
  AutoCompounded as AutoCompounded3, 
  BalanceAdded as BalanceAdded3, 
  BalanceRemoved as BalanceRemoved3
} from "../generated/AutoCompound3/AutoCompound3"

const chainName = dataSource.network();
const AUTO_COMPOUND_3_ADDRESS = chainName == "mainnet" ? "0x7c81247ae0a35b03e3f4a704dcd6b101dca53abd" : (chainName == "matic" ? "0xf887e57ad9114bb31c7506890efc181f355e9783" : (chainName == "arbitrum-one" ? "0x9d97c76102e72883cd25fa60e0f4143516d5b6db" : (chainName == "optimism" ? "0xbe931744bf0b4c4c580d375de04ee7fc2f52c568" : (chainName == "bsc" ? "0x843fe45972f638a2e7065b8d8b54efcfed09b72b" : "0x0bf485bd7ebb82e282f72e7d14822c680e3f7bec"))))

import { Compound, AccountBalance, Token, CompoundSession, TokenBalance, TokenApproval, TokenApprovalSnapshot } from "../generated/schema"

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

export function handleAutoCompounded3(event: AutoCompounded3): void {

  let token = Token.load(event.params.tokenId.toString())
  if (token) {
    token.compoundCount++
    token.compounded0 = token.compounded0.plus(event.params.amountAdded0)
    token.compounded1 = token.compounded1.plus(event.params.amountAdded1)
    token.save()
  }

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
  compound.isOwner = false
  compound.version = 3
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

export function handleBalanceAdded3(event: BalanceAdded3): void {
  let key = event.params.tokenId.toString()  + "-" + event.params.token.toHex()
  let balance = TokenBalance.load(key)
  if (!balance) {
    balance = new TokenBalance(key)
    balance.balance = BigInt.fromI32(0)
    balance.token = event.params.token
    balance.tokenId = event.params.tokenId
  }
  balance.balance = balance.balance.plus(event.params.amount);
  balance.save();
}

export function handleBalanceRemoved3(event: BalanceRemoved3): void {
  let key = event.params.tokenId.toString() + "-" + event.params.token.toHex()
  let balance = TokenBalance.load(key)
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
  let token = Token.load(event.params.tokenId.toString())
  if (token) {
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
}

export function handleApproval(event: Approval): void {
  let approval = TokenApproval.load(event.params.tokenId.toString())
  if (event.params.approved.equals(Address.fromHexString(AUTO_COMPOUND_3_ADDRESS))) {
    if (!approval) {
      approval = new TokenApproval(event.params.tokenId.toString())
      approval.tokenId = event.params.tokenId
      approval.approved = true
    } else {
      approval.approved = true
    }
    approval.owner = event.params.owner
    approval.save()

    let token = Token.load(event.params.tokenId.toString())
    if (!token) {
      token = new Token(event.params.tokenId.toString())    
      token.compoundCount = 0
      token.compounded0 = BigInt.fromI32(0)
      token.compounded1 = BigInt.fromI32(0)
    }
    token.account = event.params.owner
    token.save()
  

    let approvalSnapshot = new TokenApprovalSnapshot(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
    approvalSnapshot.approved = true;
    approvalSnapshot.tokenId = event.params.tokenId
    approvalSnapshot.timestamp = event.block.timestamp
    approvalSnapshot.owner = event.params.owner
    approvalSnapshot.save()
  } else {
    if (approval && approval.approved) {
      let approvalSnapshot = new TokenApprovalSnapshot(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
      approvalSnapshot.approved = false;
      approvalSnapshot.tokenId = event.params.tokenId
      approvalSnapshot.timestamp = event.block.timestamp
      approvalSnapshot.owner = event.params.owner
      approvalSnapshot.save()

      approval.approved = false;
      approval.save()

      let token = Token.load(event.params.tokenId.toString())
      if (token) {
        token.account = null
        token.save()
      }
    }
  }
}