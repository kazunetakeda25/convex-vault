import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";

describe("Vault", function () {
    let cvxToken: Contract;
    let crvToken: Contract;
    let lpToken: Contract;
    let daiToken: Contract;
    let usdcToken: Contract;
    let usdtToken: Contract;
    let susdToken: Contract;
    let wethToken: Contract;
    let vault: Contract;
    let booster: Contract;
    let pid = 9;

    let lpAmountForAlice: BigNumber;
    let lpAmountForBob: BigNumber;
    let lpAmountForCat: BigNumber;

    let signer: Signer;
    let alice: Signer, bob: Signer, cat: Signer;

    before("Deploy Vault and prepare accounts", async function () {
        const crvTokenAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";
        const cvxTokenAddress = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
        const lpTokenAddress = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490";

        const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        const usdcTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        const usdtTokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        const susdTokenAddress = "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51";
        const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        const boosterAddress = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
        const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
        const curveSwapAddress = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x9E51BE7071F086d3A1fD5Dc0016177473619b237"],
        });
        signer = await ethers.getSigner("0x9E51BE7071F086d3A1fD5Dc0016177473619b237");

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x60FaAe176336dAb62e284Fe19B885B095d29fB7F"],
        });
        alice = await ethers.getSigner("0x60FaAe176336dAb62e284Fe19B885B095d29fB7F");
        // 0x60FaAe176336dAb62e284Fe19B885B095d29fB7F => DAI Whale

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3"],
        });
        bob = await ethers.getSigner("0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3");
        // 0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3 => WETH Whale

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xcA8Fa8f0b631EcdB18Cda619C4Fc9d197c8aFfCa"],
        });
        cat = await ethers.getSigner("0xcA8Fa8f0b631EcdB18Cda619C4Fc9d197c8aFfCa");
        // 0xcA8Fa8f0b631EcdB18Cda619C4Fc9d197c8aFfCa => ETH Whale

        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.connect(signer).deploy(crvTokenAddress, cvxTokenAddress, boosterAddress, swapRouterAddress, curveSwapAddress, pid);

        await vault.deployed();

        crvToken = await ethers.getContractAt("MockERC20", crvTokenAddress);
        cvxToken = await ethers.getContractAt("MockERC20", cvxTokenAddress);
        lpToken = await ethers.getContractAt("MockERC20", lpTokenAddress);
        daiToken = await ethers.getContractAt("MockERC20", daiTokenAddress);
        usdcToken = await ethers.getContractAt("MockERC20", usdcTokenAddress);
        usdtToken = await ethers.getContractAt("MockERC20", usdcTokenAddress);
        susdToken = await ethers.getContractAt("MockERC20", susdTokenAddress);
        wethToken = await ethers.getContractAt("MockERC20", wethTokenAddress);

        booster = await ethers.getContractAt("IBooster", boosterAddress);
    });

    it("[Add Underlying Asset] Should owner able to add underyling asset", async () => {
        await expect(await vault.connect(signer).addUnderlyingAsset(daiToken.address)).to.be.emit(vault, "UnderlyingAssetsAdded").withArgs(daiToken.address);

        const added = await vault.underlyingAssets(daiToken.address);
        expect(added).to.be.true;
    });

    it("[Add Underlying Asset] Should revert when non-owner try to add underyling asset", async () => {
        await expect(vault.connect(alice).addUnderlyingAsset(daiToken.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("[Add Underlying Asset] Should revert to add underyling asset when underlying asset already added", async () => {
        await expect(vault.connect(signer).addUnderlyingAsset(daiToken.address)).to.be.revertedWith('Vault: Already added');
    });

    it("[Remove Underlying Asset] Should owner able to remove underyling asset", async () => {
        expect(await vault.connect(signer).removeUnderlyingAsset(daiToken.address)).to.be.emit(vault, "UnderlyingAssetsRemoved").withArgs(daiToken.address);

        const added = await vault.underlyingAssets(daiToken.address);
        expect(added).to.be.false;
    });

    it("[Remove Underlying Asset] Should revert when non-owner try to remove underyling asset", async () => {
        await expect(vault.connect(alice).removeUnderlyingAsset(daiToken.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("[Remove Underlying Asset] Should revert to remove underyling asset when underlying asset already removed", async () => {
        await expect(vault.connect(signer).removeUnderlyingAsset(daiToken.address)).to.be.revertedWith('Vault: Already removed');
    });

    it("[Deposit] Should revert if underlying asset not added", async () => {
        await expect(vault.connect(alice).deposit(daiToken.address, 100)).to.be.revertedWith('Vault: Invalid underlying asset');
    });

    it("[Deposit] Should revert if the deposit amount is zero", async () => {
        await vault.connect(signer).addUnderlyingAsset(daiToken.address);

        await expect(vault.connect(alice).deposit(daiToken.address, 0)).to.be.revertedWith('Vault: Invalid deposit amount');
    });

    it("[Deposit] Should revert if not enough allowance for deposit", async () => {
        const depositAmount = ethers.utils.parseEther("100");

        await expect(vault.connect(alice).deposit(daiToken.address, depositAmount)).to.be.revertedWith('Dai/insufficient-allowance');
    });

    it('[Deposit] Should Alice deposit 100 DAI', async () => {
        const depositAmount = ethers.utils.parseUnits("100", 6);

        const daiBalanceBeforeDeposit = await daiToken.balanceOf(alice.getAddress());
        const lpBalanceBeforeDeposit = await vault.depositAmountTotal();

        await daiToken.connect(alice).approve(vault.address, depositAmount);

        // Should emit Deposit event with correct args
        expect(await vault.connect(alice).deposit(daiToken.address, depositAmount)).to.be.emit(vault, "Deposit").withArgs(alice.getAddress(), daiToken.address, depositAmount);

        const daiBalanceAfterDeposit = await daiToken.balanceOf(alice.getAddress());
        const lpBalanceAfterDeposit = await vault.depositAmountTotal();

        // Should DAI balance decrease after deposit
        expect(daiBalanceAfterDeposit).to.be.eq(daiBalanceBeforeDeposit.sub(depositAmount));

        // Should LP balance increased after deposit
        expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

        lpAmountForAlice = lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit);
        // console.log("LP added: ", lpAmountForAlice);
    });

    it('[Deposit] Should Bob deposit 1 WETH and swap WETH for DAI from Uniswap V3', async () => {
        // Should owner able to add WETH as underyling asset
        await vault.connect(signer).addUnderlyingAsset(wethToken.address);

        const depositAmount = ethers.utils.parseUnits("1", 18);

        const wethBalanceBeforeDeposit = await wethToken.balanceOf(bob.getAddress());
        const lpBalanceBeforeDeposit = await vault.depositAmountTotal();

        await wethToken.connect(bob).approve(vault.address, depositAmount);

        // Should emit Deposit event with correct args
        expect(await vault.connect(bob).deposit(wethToken.address, depositAmount)).to.be.emit(vault, "Deposit").withArgs(bob.getAddress(), wethToken.address, depositAmount);

        const wethBalanceAfterDeposit = await wethToken.balanceOf(bob.getAddress());
        const lpBalanceAfterDeposit = await vault.depositAmountTotal();

        // Should WETH balance decrease after deposit
        expect(wethBalanceAfterDeposit).to.be.eq(wethBalanceBeforeDeposit.sub(depositAmount));

        // Should LP balance increased after deposit
        expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

        lpAmountForBob = lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit);
        // console.log("LP added: ", lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit));
    });

    it('[Deposit] Should Cat deposit 1 ETH and swap ETH for DAI from Uniswap V3', async () => {
        // Should owner able to add ETH as underyling asset
        await vault.connect(signer).addUnderlyingAsset(ethers.constants.AddressZero);

        const depositAmount = ethers.utils.parseUnits("1", 18);

        const ethBalanceBeforeDeposit = await ethers.provider.getBalance(cat.getAddress());
        const lpBalanceBeforeDeposit = await vault.depositAmountTotal();

        // Should emit Deposit event with correct args
        // Note: Even use msg.value, use same depositAmount in amount parameter
        expect(await vault.connect(cat).deposit(ethers.constants.AddressZero, depositAmount, { value: depositAmount })).to.be.emit(vault, "Deposit").withArgs(cat.getAddress(), ethers.constants.AddressZero, depositAmount);

        const ethBalanceAfterDeposit = await ethers.provider.getBalance(cat.getAddress());
        const lpBalanceAfterDeposit = await vault.depositAmountTotal();

        // Should ETH balance decrease after deposit (consider gas fee)
        expect(ethBalanceAfterDeposit).to.be.lessThan(ethBalanceBeforeDeposit.sub(depositAmount));

        // Should LP balance increased after deposit
        expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

        lpAmountForCat = lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit);
        // console.log("LP added: ", lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit));
    });

    it("[Withdraw] Should revert if withdraw amount is zero", async () => {
        await expect(vault.connect(alice).withdraw(0, false, daiToken.address)).to.be.revertedWith("Vault: Invalid withdraw amount");
    });

    it("[Withdraw] Should revert if trying to withdraw more than the deposited amount", async () => {
        const excessWithdrawAmount = ethers.utils.parseUnits("100", 'mwei').add(1);

        await expect(vault.connect(alice).withdraw(excessWithdrawAmount, false, daiToken.address)).to.be.revertedWith('Vault: Invalid withdraw amount');
    });

    it('[Reward Calculation] Should rewards calculated correctly after 1 hour', async () => {
        await time.increase(1 * 3600);

        // Get rewards from Booster
        await booster.connect(alice).earmarkRewards(pid);

        const rewards = await vault.getVaultReward(alice.getAddress());

        expect(rewards[0]).to.be.greaterThan(BigNumber.from(0));
        expect(rewards[1]).to.be.greaterThan(BigNumber.from(0));
    });

    it('[Withdraw] Should Alice withdraw lp amount correctly without swap', async () => {
        expect(await vault.connect(alice).withdraw(lpAmountForAlice, false, daiToken.address)).to.be.emit(vault, "Withdraw").withArgs(alice.getAddress(), lpAmountForAlice);
    });

    it('[Withdraw] Should Alice deposit 100000 DAI again and withdraw with swapping rewards to DAI from Uniswap V3 after 2 hours', async () => {
        const depositAmount = ethers.utils.parseUnits("100000", 6);

        const daiBalanceBeforeDeposit = await daiToken.balanceOf(alice.getAddress());
        const lpBalanceBeforeDeposit = await vault.depositAmountTotal();

        await daiToken.connect(alice).approve(vault.address, depositAmount);

        // Should emit Deposit event with correct args
        expect(await vault.connect(alice).deposit(daiToken.address, depositAmount)).to.be.emit(vault, "Deposit").withArgs(alice.getAddress(), daiToken.address, depositAmount);

        const daiBalanceAfterDeposit = await daiToken.balanceOf(alice.getAddress());
        const lpBalanceAfterDeposit = await vault.depositAmountTotal();

        // Should DAI balance decrease after deposit
        expect(daiBalanceAfterDeposit).to.be.eq(daiBalanceBeforeDeposit.sub(depositAmount));

        // Should LP balance increased after deposit
        expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

        lpAmountForAlice = lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit);
        // console.log("LP added: ", lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit));

        await time.increase(2 * 3600);

        // Get rewards from Booster
        await booster.connect(alice).earmarkRewards(pid);

        const rewards = await vault.getVaultReward(alice.getAddress());

        expect(rewards[0]).to.be.greaterThan(BigNumber.from(0));
        expect(rewards[1]).to.be.greaterThan(BigNumber.from(0));

        const daiBalanceBeforeWithdraw = await daiToken.balanceOf(alice.getAddress());

        expect(await vault.connect(alice).withdraw(lpAmountForAlice, true, daiToken.address)).to.be.emit(vault, "Withdraw").withArgs(alice.getAddress(), lpAmountForAlice);

        const daiBalanceAfterWithdraw = await daiToken.balanceOf(alice.getAddress());

        expect(daiBalanceAfterWithdraw.sub(daiBalanceBeforeWithdraw)).to.be.greaterThan(BigNumber.from(0));
    });

    it('[Withdraw] Should Bob withdraw with swapping rewards to ETH from Uniswap V3 after 1 hour', async () => {
        await time.increase(1 * 3600);

        // Get rewards from Booster
        await booster.connect(bob).earmarkRewards(pid);

        const rewards = await vault.getVaultReward(bob.getAddress());

        expect(rewards[0]).to.be.greaterThan(BigNumber.from(0));
        expect(rewards[1]).to.be.greaterThan(BigNumber.from(0));

        const ethBalanceBeforeWithdraw = await ethers.provider.getBalance(bob.getAddress());

        expect(await vault.connect(bob).withdraw(lpAmountForBob, true, ethers.constants.AddressZero)).to.be.emit(vault, "Withdraw").withArgs(bob.getAddress(), lpAmountForBob);

        const ethBalanceAfterWithdraw = await ethers.provider.getBalance(bob.getAddress());

        expect(ethBalanceAfterWithdraw.sub(ethBalanceBeforeWithdraw)).to.be.greaterThan(BigNumber.from(0));
    });

    it('[Withdraw] Should Cat withdraw with swapping rewards to WETH from Uniswap V3 after 1 hour', async () => {
        await time.increase(1 * 3600);

        // Get rewards from Booster
        await booster.connect(cat).earmarkRewards(pid);

        const rewards = await vault.getVaultReward(cat.getAddress());

        expect(rewards[0]).to.be.greaterThan(BigNumber.from(0));
        expect(rewards[1]).to.be.greaterThan(BigNumber.from(0));

        const wethBalanceBeforeWithdraw = await wethToken.balanceOf(cat.getAddress());

        expect(await vault.connect(cat).withdraw(lpAmountForCat, true, wethToken.address)).to.be.emit(vault, "Withdraw").withArgs(cat.getAddress(), lpAmountForCat);

        const wethBalanceAfterWithdraw = await wethToken.balanceOf(cat.getAddress());

        expect(wethBalanceAfterWithdraw.sub(wethBalanceBeforeWithdraw)).to.be.greaterThan(BigNumber.from(0));
    });
});
