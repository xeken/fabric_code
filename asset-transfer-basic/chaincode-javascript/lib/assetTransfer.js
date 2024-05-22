/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

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
                    StMsg: '',
                    StSvrt: 0, /* 0: 경고 후 통과, 1: 거래 불가 */
            },
            {
                    TxId: '0xf4184fc596403b9d638783cf57adfe4c75cf6fbc91338530e9831e9e17',
                    Amount: 10000000,
                    Sender: '0x1',
                    Receiver: '0x3',
                    Timestamp: '20240518110000',
                    IsSt: true,
                    StCode: 101,
                    StMsg: '[1일] 합산 [1천만 원] 이상의 가상자산 입금 후 [24시간] 이내 [1일] 합산 [1천만 원] 이상 가상자산 출금',
                    StSvrt: 0
            }
        ];

        const watchedList = [
            { Address: '0x9' },
            { Address: '0x91' }
        ];

        for (const user of users) {
            user.docType = 'user'; // db를 사용할때 필요한 속성
            await ctx.stub.putState(user.Address, Buffer.from(stringify(sortKeysRecursive(user))));
        }
        for (const wl of watchedList) {
            wl.docType = 'watchedList';
            await ctx.stub.putState('wl_' + wl.Address, Buffer.from(stringify(sortKeysRecursive(wl))));
        }
        for (const tx of transactions) {
            tx.docType = 'transaction';
            await ctx.stub.putState(tx.TxId, Buffer.from(stringify(sortKeysRecursive(tx))));
        }
    }

    // Get ↔ Set or CRUD등 Convention 정의 필요 

    async AddUser(){ }

    async GetUser(ctx, address){
        const assetJSON = await ctx.stub.getState(address); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The user:${address} does not exist`);
        }
        return assetJSON.toString();
    }

    async GetAllUsers(ctx){
        const allUsers = [];
        const iterator = await ctx.stub.getStateByRange('', ''); 
        //getStateByRange를 제대로 사용하고 싶으면 key:json set의 key값을 range가능한 값으로 재정의하여야 함.
        let result = await iterator.next();

        do{
            const object = Buffer.from(result.value.value.toString()).toString('utf8');

            if(object.includes('"docType":"user"'))
                allUsers.push(object)
            
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

    async GetWatchedList(ctx)
    {
        const allTransactions = [];
        const iterator = await ctx.stub.getStateByRange('', ''); 
        let result = await iterator.next();

        do{
            const object = Buffer.from(result.value.value.toString()).toString('utf8');

            if(object.includes('"docType":"watchedList"'))
                allTransactions.push(object)

            result = await iterator.next();
        } while (!result.done)

        return JSON.stringify(allTransactions);
    }

    async GetTransaction(ctx, txId){
        const assetJSON = await ctx.stub.getState(txId); 
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The TxID:${txId} does not exist`);
        }
        return assetJSON.toString();
    }
    
    async GetAllTransaction(ctx)
    {
        const allTransactions = [];
        const iterator = await ctx.stub.getStateByRange('', ''); 
        let result = await iterator.next();

        do{
            const object = Buffer.from(result.value.value.toString()).toString('utf8');

            if(object.includes('"docType":"transaction"'))
                allTransactions.push(object)

            result = await iterator.next();
        } while (!result.done)

        return JSON.stringify(allTransactions);
    }
    async UpdateUser(){}

    //async UpdateWatchList(ctx, action, listedAddress){} // parameter로 action을 받으면? add or remove등
    async AddWatchList(ctx, listedAddress) {}

    async RemoveWatchList(ctx, listedAddress) {}
    
    async UpdateTransaction(){}
    //User와 Transaction에 대한 delete는 없어야 하는게 맞는지
    async Transfer(ctx, senderAddress, receiverAddress, amount){
        const assetString = await this.GetUser(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }


    
/* 이하 원본 트랜잭션 코드,주석 참고용 */

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            console.log(result);
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
