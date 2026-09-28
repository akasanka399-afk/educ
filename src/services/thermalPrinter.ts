import { ThermalPrinterSettings, Payment, SchoolConfig } from '../types';
import { buildReceiptEscPos, EscPosBuilder } from './escpos';

const DEFAULT_SETTINGS: ThermalPrinterSettings = {
  connection_type: 'BROWSER_PRINT',
  paper_width: '80mm',
  density: 'medium',
  auto_cut: true,
  open_cash_drawer: false,
  print_logo: true,
};

const SETTINGS_KEY = 'edunova_printer_settings';

// UUIDs standard pour imprimantes thermiques Bluetooth Low Energy (BLE)
const BLE_PRINT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS BLE
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Posiflex / Xprinter BLE
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Service
  0xffe0, // HM-10 / MPT BLE standard
];

class ThermalPrinterService {
  private bleDevice: any = null;
  private bleServer: any = null;
  private bleCharacteristic: any = null;

  public getSettings(): ThermalPrinterSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: ThermalPrinterSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Erreur sauvegarde config imprimante', e);
    }
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  /**
   * Connexion Bluetooth BLE
   */
  public async connectBluetooth(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isBluetoothSupported()) {
      return { success: false, error: 'Web Bluetooth non supporté sur ce navigateur (utilisez Google Chrome).' };
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINT_SERVICES,
      });

      if (!device) {
        return { success: false, error: 'Aucun appareil sélectionné.' };
      }

      const server = await device.gatt.connect();
      this.bleDevice = device;
      this.bleServer = server;

      // Chercher une caractéristique inscriptible
      let foundChar = null;
      for (const serviceUuid of BLE_PRINT_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              foundChar = char;
              break;
            }
          }
          if (foundChar) break;
        } catch {
          // Continuer sur le service suivant
        }
      }

      if (!foundChar) {
        return { success: false, error: 'Imprimante connectée mais canal d\'écriture ESC/POS introuvable.' };
      }

      this.bleCharacteristic = foundChar;

      // Enregistrer le nom de l'appareil
      const settings = this.getSettings();
      settings.connection_type = 'BLE';
      settings.device_name = device.name || 'Imprimante BLE 80mm';
      this.saveSettings(settings);

      return { success: true, deviceName: device.name };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Échec de la connexion Bluetooth.' };
    }
  }

  /**
   * Envoi de données ESC/POS découpées en paquets MTU (chunking)
   */
  public async sendEscPosData(data: Uint8Array): Promise<boolean> {
    const settings = this.getSettings();

    if (settings.connection_type === 'BLE' && this.bleCharacteristic) {
      try {
        const CHUNK_SIZE = 64; // taille de buffer sûre pour éviter le débordement GATT
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          if (this.bleCharacteristic.writeValueWithoutResponse) {
            await this.bleCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.bleCharacteristic.writeValue(chunk);
          }
          // Petite pause anti-saturation
          await new Promise((r) => setTimeout(r, 20));
        }
        return true;
      } catch (err) {
        console.error('Erreur transmission BLE:', err);
        return false;
      }
    }

    // Si pas de BLE ou erreur, repli vers dialogue d'impression système
    return false;
  }

  /**
   * Impression d'un ticket de test
   */
  public async printTestTicket(school: SchoolConfig): Promise<{ success: boolean; mode: string }> {
    const settings = this.getSettings();
    const cols = settings.paper_width === '80mm' ? 48 : 32;
    const builder = new EscPosBuilder(cols);

    builder.alignCenter().bold(true).doubleHeight();
    builder.textLine(school.name);
    builder.normalSize().bold(false);
    builder.textLine('TEST D\'IMPRESSION THERMIQUE 80MM');
    builder.doubleDivider();
    builder.twoColumnLine('Format:', settings.paper_width);
    builder.twoColumnLine('Connexion:', settings.connection_type);
    builder.twoColumnLine('Date/Heure:', new Date().toLocaleTimeString('fr-FR'));
    builder.divider();
    builder.textLine('Verifiez la nettete des caracteres :');
    builder.textLine('ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789');
    builder.bold(true).textLine('LIGNE EN CARACTERES GRAS').bold(false);
    builder.feed(1);
    builder.qrCode(`EDUNOVA-TEST-${Date.now()}`);
    builder.textLine('QR Code test valide');
    builder.divider();
    builder.textLine('EduNova Primaire - Test reussi !');
    builder.doubleDivider();
    if (settings.auto_cut) {
      builder.cut();
    }

    const bytes = builder.toBytes();
    const sent = await this.sendEscPosData(bytes);

    if (sent) {
      return { success: true, mode: 'BLE' };
    } else {
      // Déclenche l'aperçu/impression navigateur
      return { success: true, mode: 'BROWSER_FALLBACK' };
    }
  }

  /**
   * Impression du reçu de paiement officiel
   */
  public async printPaymentReceipt(
    payment: Payment,
    school: SchoolConfig,
    isDuplicate: boolean = false
  ): Promise<{ printedVia: 'BLE' | 'BROWSER' }> {
    const settings = this.getSettings();
    const bytes = buildReceiptEscPos(
      payment,
      school,
      isDuplicate,
      settings.paper_width,
      settings.open_cash_drawer,
      settings.auto_cut
    );

    const sent = await this.sendEscPosData(bytes);
    if (sent) {
      return { printedVia: 'BLE' };
    }
    return { printedVia: 'BROWSER' };
  }
}

export const thermalPrinter = new ThermalPrinterService();
