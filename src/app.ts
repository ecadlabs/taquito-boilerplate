import { Tezos, TezosToolkit } from "@taquito/taquito";
import { TezBridgeWallet } from "@taquito/tezbridge-wallet";
import { ThanosWallet } from "@thanos-wallet/dapp";
import $ from "jquery";

export class App {
  private tk: TezosToolkit = Tezos;
  private contract: any;
  public contractAddress = "KT1Pdsb8cUZkXGxVaXCzo9DntriCEYdG9gWT";
  public counter: number;
  public userAddress: string | null;

  constructor() {
    this.tk.setRpcProvider("https://carthagenet.smartpy.io");
    // creates contract singleton
    this.contract = undefined;
    this.counter = 0;
    this.userAddress = null;
  }

  private async initContract() {
    const contract = await this.tk.wallet.at(this.contractAddress);
    const storage: any = await contract.storage();

    return { contract, storage: storage.toNumber() };
  }

  public initUI() {
    $("#show-balance-button").bind("click", () =>
      this.getBalance($("#address-input").val())
    );

    $("#connect-tezbridge").bind("click", () => {
      this.connectTezbridge();
    });

    $("#connect-thanos").bind("click", () => {
      this.connectThanos();
    });

    $("#increment-counter").bind("click", () => {
      this.incrementCounter();
    });

    $("#decrement-counter").bind("click", () => {
      this.decrementCounter();
    });
  }

  private showError(message: string) {
    $("#balance-output").removeClass().addClass("hide");
    $("#error-message")
      .removeClass()
      .addClass("show")
      .html("Error: " + message);
  }

  private showBalance(balance: number) {
    $("#error-message").removeClass().addClass("hide");
    $("#balance-output").removeClass().addClass("show");
    $("#balance").html(balance);
  }

  private getBalance(address: string) {
    this.tk.rpc
      .getBalance(address)
      .then(balance => this.showBalance(balance.toNumber() / 1000000))
      .catch(e => this.showError("Address not found"));
  }

  private async connectTezbridge() {
    const wallet = new TezBridgeWallet();
    this.tk.setWalletProvider(wallet);
    this.userAddress = await wallet.getPKH();
    this.getBalance(this.userAddress as string);
    const { contract, storage } = await this.initContract();
    this.contract = contract;
    this.counter = storage;
    $("#counter-value").text(storage);
    $("#header__connect-wallet").addClass("hide");
    $("#balance-form").addClass("hide");
    $("#increment-decrement").removeClass("hide").addClass("show");
    $("#header__interact-with-contract").removeClass("hide").addClass("show");
  }

  private async connectThanos() {
    if (await ThanosWallet.isAvailable()) {
      const wallet = new ThanosWallet("Taquito Boilerplate");
      await wallet.connect("carthagenet");
      this.tk.setWalletProvider(wallet);
      this.userAddress = await wallet.getPKH();
      this.getBalance(this.userAddress as string);
      const { contract, storage } = await this.initContract();
      this.contract = contract;
      this.counter = storage;
      $("#counter-value").text(storage);
      $("#header__connect-wallet").addClass("hide");
      $("#balance-form").addClass("hide");
      $("#increment-decrement").removeClass("hide").addClass("show");
      $("#header__interact-with-contract").removeClass("hide").addClass("show");
    }
  }

  private async incrementCounter() {
    try {
      $("#loading").removeClass("hide").addClass("show");
      const op = await this.contract.methods.increment(1).send();
      await op.confirmation();
      this.counter += 1;
      $("#counter-value").text(this.counter);
      this.getBalance(this.userAddress as string);
    } catch (error) {
      console.log(error);
    } finally {
      $("#loading").removeClass("show").addClass("hide");
    }
  }

  private async decrementCounter() {
    try {
      $("#loading").removeClass("hide").addClass("show");
      const op = await this.contract.methods.decrement(1).send();
      await op.confirmation();
      this.counter -= 1;
      $("#counter-value").text(this.counter);
      this.getBalance(this.userAddress as string);
    } catch (error) {
      console.log(error);
    } finally {
      $("#loading").removeClass("show").addClass("hide");
    }
  }
}
