import * as RequestPromise from 'request-promise';
import * as Task from 'vsts-task-lib';

import { ZapScanBase } from './ZapScanBase';
import { ScanResult } from './../interfaces/types/ScanResult';
import { ZapActiveScanOptions, ZapScanResult, ZapScanStatus } from './../interfaces/types/ZapScan';
import { IZapScan } from './../interfaces/contracts/IZapScan';
import { ZapScanType } from '../enums/Enums';

export class ActiveScan extends ZapScanBase {
    zapScanType: ZapScanType = ZapScanType.Active;    
    private scanOptions: ZapActiveScanOptions;

    constructor(
        public zapApiUrl: string,
        public zapApiKey: string,
        public targetUrl: string,
        public contextId: string,
        public recurse: boolean,
        public inScopeOnly: boolean,
        public scanPolicyName: string,
        public method: string,
        public postData: string
    ) {
        super(zapApiUrl, zapApiKey);

        /* Set Scan Type for Logging */
        this.scanType = 'Active Scan';

        /* Active Scan Options */
        this.scanOptions = {
            apikey: zapApiKey,
            url: targetUrl,
            contextId: contextId,
            method: method,
            inScopeOnly: String(inScopeOnly),
            recurse: String(recurse),
            scanPolicyName: scanPolicyName,
            postData: postData,
            zapapiformat: 'JSON',
            formMethod: 'GET'
        };

        /* Scan Request Options */
        this.requestOptions = {
            // tslint:disable-next-line:no-http-string
            uri: `http://${zapApiUrl}/JSON/ascan/action/scan/`,
            qs: this.scanOptions
        };
    }

    ExecuteScan(): Promise<ScanResult> {
        const scanResult: ScanResult = { Success: false };

        Task.debug('*** Initiate the Active Scan ***');
        Task.debug(`Target URL: ${this.requestOptions.uri}`);
        Task.debug(`Scan Options: ${JSON.stringify(this.scanOptions)}`);

        return new Promise<ScanResult> ((resolve, reject) => {
            RequestPromise(this.requestOptions)
                .then(async (res: any) => {

                    const result: ZapScanResult = JSON.parse(res);
                    console.log(`OWASP ZAP Active Scan Initiated. ID: ${result.scan}`);
                    
                    scanResult.Success = await this.CheckScanStatus(result.scan, this.zapScanType);
                    if (!scanResult.Success) {
                        scanResult.Message = 'Active Scan status check failed.';
                        reject(scanResult);
                    }

                    resolve(scanResult);
                })
                .error((err: any) => {
                    scanResult.Success = false;
                    scanResult.Message = err.message || err;

                    reject(scanResult);
                });

        });
    }
}