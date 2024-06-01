/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const crypto = require('crypto');
const base58 = require('bs58');
const { Contract } = require('fabric-contract-api');
const { send } = require('process');
const { time } = require('console');

const H24 = 86400000;

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const users = [
            {
                Address: '0x1', /* identifier, string */
                Owner: '가기규', /* string */
                Balance: 30000000, /* number */
                Age: 30, /* number */
                Gender: 'M', /* M: 남성, F: 여성 */
                Job: '회사원', /* 사업가, 직장인, 정치인, 테러리스트, 종교인, 학생, 무직 */
                Txs: [ /* 트랜잭션 내역 */
				    "0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e16",
				    "0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e17",
				],
                Status: 0, /* 0: 정상, 1: 휴면, 2: 정지 */
                CreateDt: '20240518000000', /* YYYYMMDDHHmmss */
                UpdateDt: '20240518110000' 
            },
            {
                Address: '0x2', /* identifier, string */
                Owner: '관리자', /* string */
                Balance: 1000, /* number */
                Age: 30, /* number */
                Gender: 'M', /* M: 남성, F: 여성 */
                Job: '사업가', /* 사업가, 직장인, 정치인, 테러리스트, 종교인, 학생, 무직 */
                Txs: [ /* 트랜잭션 내역 */
                    "0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e16",
                    "0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e17",
                ],
                Status: 0, /* 0: 정상, 1: 휴면, 2: 정지 */
                CreateDt: '20240518000000', /* YYYYMMDDHHmmss */
                UpdateDt: '20240518110000' 
            },
            {
                Address: '0x9', /* identifier, string */
                Owner: '김정은', /* string */
                Balance: 999, /* number */
                Age: 40, /* number */
                Gender: 'M', /* M: 남성, F: 여성 */
                Job: '정치인', /* 사업가, 직장인, 정치인, 테러리스트, 종교인, 학생, 무직 */
                Txs: [ ],
                Status: 0, /* 0: 정상, 1: 휴면, 2: 정지 */
                CreateDt: '20240518000000', /* YYYYMMDDHHmmss */
                UpdateDt: '20240518110000' 
            },
            {
                Address: '0x91', /* identifier, string */
                Owner: '오사마빈라덴', /* string */
                Balance: 888, /* number */
                Age: 60, /* number */
                Gender: 'M', /* M: 남성, F: 여성 */
                Job: '테러리스트', /* 사업가, 직장인, 정치인, 테러리스트, 종교인, 학생, 무직 */
                Txs: [ ],
                Status: 0, /* 0: 정상, 1: 휴면, 2: 정지 */
                CreateDt: '20240518000000', /* YYYYMMDDHHmmss */
                UpdateDt: '20240518110000' 
            },
        ];

        const transactions = [
            {
                    TxId: '0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e16',
                    Amount: 100000, /* number */
                    Sender: '0x1', /* sender's id */
                    Receiver: '0x2', /* receiver's id */
                    Timestamp: '20240518100000',
                    IsSt: false, /* boolean */
                    StCode: 0, /* ST Rule Set Number */
                    StSvrt: 0, /* 0: 경고 후 통과, 1: 거래 불가 */
                    IsExcuted: true
            },
            {
                    TxId: '0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e17',
                    Amount: 10000000,
                    Sender: '0x1',
                    Receiver: '0x3',
                    Timestamp: '20240518110000',
                    IsSt: true,
                    StCode: 101,
                    StSvrt: 0,
                    IsExcuted: false
            }
        ];

        const watchList = [
            {
                Name: "김정은",
                Age: 40,
                Gender: "M",
                nation: "NP",
                Job: "정치인",
            },
            {
                Name: "오사마빈라덴",
                Age: 60,
                Gender: "M",
                nation: "IS",
                Job: "테러리스트",
            }
        ];

        for (const user of users) {
            user.docType = 'user'; // db를 사용할때 필요한 속성
            await ctx.stub.putState(user.Address, Buffer.from(stringify(sortKeysRecursive(user))));
        }
        for( const index in watchList){
            watchList[index].docType ='watchList';  
            await ctx.stub.putState(`wl${index}`, Buffer.from(stringify(sortKeysRecursive(watchList[index]))));
        }
        // for (const wl of watchList) {
        //     wl.docType = 'watchList';
        //     await ctx.stub.putState(, Buffer.from(stringify(sortKeysRecursive(wl))));
        // }
        for (const tx of transactions) {
            tx.docType = 'transaction';
            await ctx.stub.putState(tx.TxId, Buffer.from(stringify(sortKeysRecursive(tx))));
        }
    }

    async AddUser(ctx, name, age, gender, job){ 
        // wlf 체크
        const wlf = JSON.parse(this.GetWatchList(ctx));
        for(const index in wlf) {
            const info = wlf[index];
            if((name === info.Name) && (age === info.Age) &&
                (gender === info.Gender) && (job === info.Job)){
                return false;
            }
        }​
        
        const timestamp = Date.now();
        const user = {
            Owner: name,
            Balance: 0,
            Age: age,
            Gender: gender,
            Job: job,
            Txs: [],
            Status: 0,
            CreateDt: timestamp,
            UpdateDt: timestamp,
        };

        const hash = base58.encode(crypto.createHash('sha256').update(JSON.stringify(user)).digest('hex'));
        user.Address = hash;

        await ctx.stub.putState(hash, Buffer.from(stringify(sortKeysRecursive(user))));
        return true;
    }

    async GetUser(ctx, address){
        const user = await ctx.stub.getState(address); // get the asset from chaincode state
        if (!user || user.length === 0) {
            //throw new Error(`The user:${address} does not exist`);
            return false;
        }
        return user.toString();
    }

    async GetAllUsers(ctx){
        const allUsers = [];
        const iterator = await ctx.stub.getStateByRange('', ''); 
        //getStateByRange를 제대로 사용하고 싶으면 key:json set의 key값을 range가능한 값으로 재정의하여야 함.
        let result = await iterator.next();

        do{
            const object = Buffer.from(result.value.value.toString()).toString('utf8');

            if(object.includes('"docType":"user"'))
                allUsers.push(JSON.parse(object));
            
            /* @NOTE JSON.parse는 항상 오류가 발생됩니다?
            let record;
            try{
                record = JSON.parse(object); 
                if (record.doctype === "transaction")
                    allUsers.push(record);
            } catch (err) { 
                console.log(err); 
                record = object;
            }
            */

            result = await iterator.next();
        } while (!result.done)

        return JSON.stringify(allUsers);
    }

    async GetWatchList(ctx)
    {
        const watchList = [];
        const iterator = await ctx.stub.getStateByRange('', ''); 
        let result = await iterator.next();

        do{
            const object = Buffer.from(result.value.value.toString()).toString('utf8');
            
            if(object.includes('"docType":"watchList"'))
                watchList.push(JSON.parse(object))
            
            result = await iterator.next();
        } while (!result.done)

        return JSON.stringify(watchList);
    }

    async GetTransaction(ctx, txId){
        const tx = await ctx.stub.getState(txId); 
        if (!tx || tx.length === 0) {
            //throw new Error(`The TxID:${txId} does not exist`);
            return false;
        }
        return tx.toString();
    }
    
    async GetAllTransactions(ctx)
    {
        const allTransactions = [];
        const iterator = await ctx.stub.getStateByRange('', ''); 
        let result = await iterator.next();

        do{
            const object = Buffer.from(result.value.value.toString()).toString('utf8');

            if(object.includes('"docType":"transaction"'))
                allTransactions.push(JSON.parse(object));

            result = await iterator.next();
        } while (!result.done)

        return JSON.stringify(allTransactions);
    }

    async UpdateUser(ctx, address,property, value){
        const user = JSON.parse(await this.GetUser(ctx, id));

        switch(property){
            case 'Balance' : { 
                user.Balance = value;
                break; 
            }
            case 'Age' : { 
                user.Age = value;
                break; 
            }
            case 'Gender' : { 
                user.Gender = value;
                break; 
            }
            case 'Job' : { 
                user.Job = value;
                break; 
            }
            case 'Status' : { 
                user.Status = value;
                break; 
            }
            default: {
                break;
            } 
        }

        ctx.stub.putState(address, Buffer.from(stringify(sortKeysRecursive(user))));

        return true;
    }

    async ExcuteSTransaction(ctx, txId){
        const tx = JSON.parse(await this.GetTransaction(ctx, txId));
        const sender = JSON.parse(await this.GetUser(ctx, tx.Sender));
        const receiver = JSON.parse(await this.GetUser(ctx, tx.Receiver));

        tx.IsExcuted = true;
        tx.Timestamp = Date.now();

        if(sender.Balance < tx.Amount)
            return false;
        
        sender.Balance -= tx.Amount;
        receiver.Balance += tx.Amount;

        ctx.stub.putState(txId, Buffer.from(stringify(sortKeysRecursive(tx))));
        ctx.stub.putState(sender.Address, Buffer.from(stringify(sortKeysRecursive(sender))));
        ctx.stub.putState(receiver.Address, Buffer.from(stringify(sortKeysRecursive(receiver))));

        return true;
    }

    async Transfer(ctx, senderAddress, receiverAddress, amount){ // return값은 boolean으로
        const sender = JSON.parse(await this.GetUser(ctx, senderAddress));
        const receiver = JSON.parse(await this.GetUser(ctx, receiverAddress));
        const ledger = JSON.parse(await this.GetAllTransactions(ctx));
        
        //Balance 체크는 웹에서 GetUser를 통해 먼저 검증할 것 -> 트랜잭션 생성문제. 여기서는 ST만 filtering하는 걸로 

        let stCode = 0;
        
        // 아래 CheckCode 함수를 병렬처리할 수 있는 방법???
        if(this.CheckCode119()){
            stCode = 119;
        }
        else if(this.CheckCode120()){
            stCode = 120;
        }
        else if(this.CheckCode111()){
            stCode = 111;
        }
        else if(this.CheckCode112(ledger, sender)){
            stCode = 112;
        }
        else if(this.CheckCode113()){
            stCode = 113;
        }
        else if(this.CheckCode114()){
            stCode = 114;
        }
        else if(this.CheckCode115()){
            stCode = 115;
        }
        else if(this.CheckCode121()){
            stCode = 121;
        }
        else if(this.CheckCode101(ledger, sender.Address, sender.Txs)){
            stCode = 101;
        }
        else if(this.CheckCode102()){
            stCode = 102;
        }
        else if(this.CheckCode105()){
            stCode = 105;
        }
        else if(this.CheckCode106()){
            stCode = 106;
        }
        else if(this.CheckCode110()){
            stCode = 110;
        }
        
        const newTransaction = {
            Amount: amount, /* number */
            Sender: senderAddress, /* sender's id */
            Receiver: receiverAddress, /* receiver's id */
            Timestamp: Date.now(),
            IsSt: stCode != 0, /* boolean */
            StCode: stCode, /* ST Rule Set Number */
            StSvrt: 0, /* 0: 미해당, 1: 경고 후 통과, 9: 거래 불가 */
            docType: "transaction"
        };

        const hash = base58.encode(crypto.createHash('sha256').update(JSON.stringify(newTransaction)).digest('hex'));
        newTransaction.TxId = hash;
        
        sender.Txs.push(hash);
        receiver.Txs.push(hash);

        await ctx.stub.putState(sender.Address, Buffer.from(stringify(sortKeysRecursive(sender))));
        await ctx.stub.putState(receiver.Address, Buffer.from(stringify(sortKeysRecursive(receiver))));
        await ctx.stub.putState(hash, Buffer.from(stringify(sortKeysRecursive(newTransaction))));
        return true;
        //트랜잭션을 생성하고, 이후 updateUser를 하는 과정에서 st를 체크, 0이면 amount 업데이트, 이외는 보류
    }

    //[1일] 합산 [1천만 원] 이상의 가상자산 입금 후 혹은 동시에 당일 [1일] 합산 [1천만 원] 이상 가상자산 출금
    CheckCode101(ledger, senderAddress, senderTxs) { 

        if(senderTxs.length == 0) return false;

        let index = senderTxs.length - 1;
        //let tx = ledger[senderTxs[i]];
        let tx = ledger.filter(l => l.TxId === senderTxs[index]);    
        // tx  = ledger.TxId == senderTxs[i] 인 오브젝트
        // 배열 안 배열 안
        const lastTimestamp = tx.Timestamp;
        let sendedAmount = 0; 
        let receivedAmount = 0;

        while(index > 0){
            //  await this.GetTransaction(senderTxs[i])
            //tx = ledger[senderTxs[--i]];
            if((tx.Timestamp - lastTimestamp) >= H24) // 24 * 60 * 60 * 1000
                break;

            if(tx.Sender === senderAddress)
                sendedAmount += tx.Amount;
            else 
                receivedAmount += tx.Amount;
 
            tx = ledger.filter(l => l.TxId === senderTxs[--index]); 
        }

        return (sendedAmount >= 10000000 && receivedAmount >= 10000000);
    }

    //[1일] 합산 [5회] 이상 [100만 원] 이상의 가상자산 출금
    CheckCode102() {


        return false;
    }

    //[1일] 합산 [10회] 이상 가상자산 입금
    CheckCode105() {

        return false;
    }

    //[1일] 합산 [10회] 이상 가상자산 출금
    CheckCode106() {

        return false;
    }

    //한 개의 지갑주소에 [7일]간 건당 [1백만 원] 이상이며 합산 [5개] 이상의 지갑 주소에서 가상자산 입금
    CheckCode110(){

        return false;
    }

    //한 개의 지갑주소에서 [7일]간 건당 [1백만 원] 이상이며 합산 [5개] 이상의 지갑 주소로 가상자산 출금
    CheckCode111(){

        return false;
    }

    //직업이 [무직, 학생, 종교인]인 고객 [1일] 합산 [5천만 원] 이상 가상자산 입금
    CheckCode112(ledger, sender){
        if(sender.Txs.length == 0 || 
            (!['무직', '학생', '종교인'].includes(sender.Job))) 
            return false;

        let index = sender.Txs.length - 1;
        let tx = ledger.filter(l => l.TxId === sender.Txs[index]);    
        const lastTimestamp = tx.Timestamp;
        let totalAmount = 0;
        while(index > 0){
            if((tx.Timestamp - lastTimestamp) >= H24) // 24 * 60 * 60 * 1000
                break;
            if(tx.receiverAddress === sender.Address)    
                totalAmount += tx.Amount;
            
            tx = ledger.filter(l => l.TxId === sender.Txs[--index]); 
        }

        return (totalAmount >= 50000000)
    }

    //직업이 [무직, 학생, 종교인]인 고객 [1일] 합산 [3천만 원] 이상 가상자산 출금
    CheckCode113(){

        return false;
    }

    //[만 65세] 이상의 고령 고객이 [3천만 원] 이상의 가상자산을 [1일]에 [3회] 이상 입금
    CheckCode114(){

        return false;
    }

    //[만 65세] 이상의 고령 고객이 [1천만 원] 이상 가상자산을 [1일]에 [2회] 이상 출금
    CheckCode115(){

        return false;
    }

    //WLF 요주의인물 리스트 고객이 [1일]에 합산 [3백만 원] 이상의 가상자산을 출금하는 경우
    CheckCode119(){

        return false;
    }

    //[휴면계정] 고객 [휴면상태]에게 [1백만 원] 이상 가상자산 입금
    CheckCode120(){

        return false;
    }

    //[1일]? [5백만 원] 이상 입금 후 [30분] 이내에 출금
    CheckCode121(){

    }
}

module.exports = AssetTransfer;
