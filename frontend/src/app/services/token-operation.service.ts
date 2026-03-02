import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenOperationService {
  isIssue(tx: any, colorId: string): boolean {
    // Issue if no input has the same colorId
    return !tx.vin?.some(input => input.prevout?.colorId === colorId);
  }

  isBurn(tx: any, colorId: string): boolean {
    // Burn if total input amount > total output amount for the colorId
    const inputSum = (tx.vin || [])
      .filter(input => input.prevout?.colorId === colorId)
      .reduce((sum, input) => sum + (input.prevout?.value || 0), 0);
    const outputSum = (tx.vout || [])
      .filter(output => output.colorId === colorId)
      .reduce((sum, output) => sum + (output.value || 0), 0);
    return inputSum > outputSum;
  }

  // For outputs: ISSUE or TRANSFER only
  getOutputOperationType(tx: any, colorId: string): string {
    return this.isIssue(tx, colorId) ? 'ISSUE' : 'TRANSFER';
  }

  getOutputOperationColor(tx: any, colorId: string): string {
    return this.isIssue(tx, colorId) ? 'success' : 'secondary';
  }

  // For inputs: BURN or TRANSFER only
  getInputOperationType(tx: any, colorId: string): string {
    return this.isBurn(tx, colorId) ? 'BURN' : 'TRANSFER';
  }

  getInputOperationColor(tx: any, colorId: string): string {
    return this.isBurn(tx, colorId) ? 'danger' : 'secondary';
  }
}