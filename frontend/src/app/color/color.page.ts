import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { BackendService } from '../backend.service';
import { TokenOperationService } from '../services/token-operation.service';

@Component({
  selector: 'app-color',
  templateUrl: './color.page.html',
  styleUrls: ['./color.page.scss'],
  standalone: false
})
export class ColorPage implements OnInit {
  colorId: string;
  tokenType: string;
  stats: any = {};
  metadata: any = null;
  txids = new Set();
  txs: any = [];
  lastSeenTxid?: string;
  hasMore = false;
  isLoading = false;
  hasError: boolean;
  statusCode: string;
  statusMsg: string;
  detailMsg: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private backendService: BackendService,
    private cdr: ChangeDetectorRef,
    public tokenOp: TokenOperationService
  ) {}

  ngOnInit() {
    this.colorId = this.activatedRoute.snapshot.paramMap.get('colorId') || '';
    if (this.colorId.startsWith('c1')) {
      this.tokenType = 'Reissuable';
    } else if (this.colorId.startsWith('c2')) {
      this.tokenType = 'Non Reissuable';
    } else if (this.colorId.startsWith('c3')) {
      this.tokenType = 'NFT';
    } else {
      this.tokenType = 'Unknown';
    }

    this.getColorInfo();
    this.getMetadata();
  }

  getMetadata() {
    this.backendService.getColorMetadata(this.colorId).subscribe(
      data => {
        this.metadata = data;
        this.cdr.detectChanges();
      },
      () => {
        // Metadata not found, ignore error
        this.metadata = null;
      }
    );
  }

  getColorInfo() {
    this.resetError();
    this.isLoading = true;
    this.backendService.getColor(this.colorId, this.lastSeenTxid).subscribe(
      data => {
        this.stats = data['stats']['chain_stats'] || {};
        const newTxs = data['tx']['txs'].filter(tx => !this.txids.has(tx.txid));
        newTxs.forEach(tx => {
          this.txids.add(tx.txid);
          this.txs.push(tx);
        });
        this.lastSeenTxid = data['tx']['last_seen_txid'];
        this.hasMore = newTxs.length > 0 && !!this.lastSeenTxid;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      err => {
        console.log(err);
        this.hasError = true;
        this.statusCode = err.status;
        this.statusMsg = err.statusText;
        this.detailMsg = err.error;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  goToCoin(colorId) {
    this.navCtrl.navigateForward(`/color/${colorId}`);
  }

  // Wrapper methods for TokenOperationService using this.colorId
  getOutputOperationType(tx): string {
    return this.tokenOp.getOutputOperationType(tx, this.colorId);
  }

  getOutputOperationColor(tx): string {
    return this.tokenOp.getOutputOperationColor(tx, this.colorId);
  }

  getInputOperationType(tx): string {
    return this.tokenOp.getInputOperationType(tx, this.colorId);
  }

  getInputOperationColor(tx): string {
    return this.tokenOp.getInputOperationColor(tx, this.colorId);
  }

  goToAddress(add = '') {
    this.navCtrl.navigateForward(`/addresses/${add}`);
  }

  goToTransaction(txid = '') {
    this.navCtrl.navigateForward(`/tx/${txid}`);
  }

  hasNftData(): boolean {
    return !!(
      this.metadata?.image ||
      this.metadata?.animation_url ||
      this.metadata?.attributes?.length
    );
  }

  onNextPage() {
    this.getColorInfo();
  }

  resetError() {
    this.hasError = false;
    this.statusCode = null;
    this.statusMsg = null;
    this.detailMsg = null;
  }
}
