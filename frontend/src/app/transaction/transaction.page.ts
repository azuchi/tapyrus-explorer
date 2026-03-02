import {
  AfterViewChecked,
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ModalController,
  NavController,
  ToastController
} from '@ionic/angular';

import { TransactionRawdataPage } from '../transaction-rawdata/transaction-rawdata.page';
import { BackendService } from '../backend.service';
import Helper from '../app.helper';
import { TokenOperationService } from '../services/token-operation.service';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
  standalone: false
})
export class TransactionPage implements OnInit, AfterViewChecked {
  txid: string;
  transaction: any = {};
  hasError: boolean;
  statusCode: string;
  statusMsg: string;
  detailMsg: string;
  isMaterialTracking: boolean;
  hasMaterialTrackingCheckResult: boolean;
  isMaterialTrackingBalanced: boolean;
  isScrolling = true;
  scrollTarget: string;
  detailVisible = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private backendService: BackendService,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    public tokenOp: TokenOperationService
  ) {}

  ngOnInit() {
    this.txid = this.activatedRoute.snapshot.paramMap.get('txid');
    this.getTransactionInfo();
  }
  ngAfterViewChecked() {
    this.scrollToOutput();
  }

  async copy(text: string) {
    Helper.copy(this.toastController, text);
  }

  getTransactionInfo() {
    this.resetError();
    this.backendService.getTransaction(this.txid).subscribe(
      data => {
        this.transaction = data || {};
        this.calculateTotal();
        this.isMaterialTracking = data.isMaterialTracking;
        this.cdr.detectChanges();
      },
      err => {
        console.log(err);
        this.hasError = true;
        this.statusCode = err.status;
        this.statusMsg = err.statusText;
        this.detailMsg = err.error;
        this.cdr.detectChanges();
      }
    );
  }

  toggleDetail() {
    this.detailVisible = !this.detailVisible;
  }

  scrollToOutput() {
    try {
      const hash = document.location.hash;
      const target = document.querySelector(hash);
      if (target && this.isScrolling) {
        this.scrollTarget = hash;
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
          this.isScrolling = false;
        }, 100);
      }
    } catch (e) {}
  }
  resetError() {
    this.hasError = false;
    this.statusCode = null;
    this.statusMsg = null;
    this.detailMsg = null;
  }

  calculateTotal() {
    this.transaction.totalVout = this.transaction.vout
      .filter(output => !output.colorId)
      .reduce((sum, output) => sum + output.value, 0);
  }

  goToTransactions() {
    this.navCtrl.navigateBack('/tx/recent');
  }

  goToAddress(add = '') {
    this.navCtrl.navigateForward(`/addresses/${add}`);
  }

  goToTransaction(txid, index) {
    this.navCtrl.navigateForward(`/tx/${txid}`, { fragment: index });
  }

  goToCoin(colorId) {
    this.navCtrl.navigateForward(`/color/${colorId}`);
  }

  goToBlock(hash: string) {
    this.navCtrl.navigateForward(`/block/${hash}`);
  }

  checkBalance() {
    this.hasMaterialTrackingCheckResult = false;
    this.backendService.checkMaterialTrackingTransaction(this.txid).subscribe(
      data => {
        this.hasMaterialTrackingCheckResult = true;
        this.isMaterialTrackingBalanced = data.balanced;
        this.cdr.detectChanges();
      },
      err => {
        console.log(err);
        this.cdr.detectChanges();
      }
    );
  }

  async goToTransactionRawData() {
    const modal = await this.modalCtrl.create({
      component: TransactionRawdataPage,
      componentProps: {
        txid: this.txid
      },
      cssClass: 'raw-data-modal'
    });
    return await modal.present();
  }
}
