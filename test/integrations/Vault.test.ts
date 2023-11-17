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

    let signer: Signer;
    let alice: Signer, bob: Signer, cat: Signer;

    before("Deploy Vault and prepare accounts", async function () {
        const crvTokenAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";
        const cvxTokenAddress = "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B";
        const lpTokenAddress = "0xC25a3A3b969415c80451098fa907EC722572917F";

        const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        const usdcTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        const usdtTokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        const susdTokenAddress = "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51";
        const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        const boosterAddress = "0xF403C135812408BFbE8713b5A23a04b3D48AAE31";
        const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
        const curveSwapAddress = "0xA5407eAE9Ba41422680e2e00537571bcC53efBfD";
        const pid = 4;

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

    // it('[Deposit] Should Alice deposit 100 DAI', async () => {
    //     const depositAmount = ethers.utils.parseUnits("100", 6);

    //     const daiBalanceBeforeDeposit = await daiToken.balanceOf(alice.getAddress());
    //     const lpBalanceBeforeDeposit = await vault.depositAmountTotal();

    //     await daiToken.connect(alice).approve(vault.address, depositAmount);

    //     // Should emit Deposit event with correct args
    //     expect(await vault.connect(alice).deposit(daiToken.address, depositAmount)).to.be.emit(vault, "Deposit").withArgs(alice.getAddress(), daiToken.address, depositAmount);

    //     const daiBalanceAfterDeposit = await daiToken.balanceOf(alice.getAddress());
    //     const lpBalanceAfterDeposit = await vault.depositAmountTotal();

    //     // Should DAI balance decrease after deposit
    //     expect(daiBalanceAfterDeposit).to.be.eq(daiBalanceBeforeDeposit.sub(depositAmount));

    //     // Should LP balance increased after deposit
    //     expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

    //     console.log("LP added: ", lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit));
    // });

    // it('[Deposit] Should Bob deposit 1 WETH and swap WETH for DAI from Uniswap V3', async () => {
    //    // Should owner able to add WETH as underyling asset
    //     await vault.connect(signer).addUnderlyingAsset(wethToken.address);

    //     const depositAmount = ethers.utils.parseUnits("1", 18);

    //     const wethBalanceBeforeDeposit = await wethToken.balanceOf(bob.getAddress());
    //     const lpBalanceBeforeDeposit = await vault.depositAmountTotal();

    //     await wethToken.connect(bob).approve(vault.address, depositAmount);

    //     Should emit Deposit event with correct args
    //     expect(await vault.connect(bob).deposit(wethToken.address, depositAmount)).to.be.emit(vault, "Deposit").withArgs(bob.getAddress(), wethToken.address, depositAmount);

    //     const wethBalanceAfterDeposit = await wethToken.balanceOf(bob.getAddress());
    //     const lpBalanceAfterDeposit = await vault.depositAmountTotal();

    //     Should WETH balance decrease after deposit
    //     expect(wethBalanceAfterDeposit).to.be.eq(wethBalanceBeforeDeposit.sub(depositAmount));

    //     Should LP balance increased after deposit
    //     expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

    //     console.log("LP added: ", lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit));
    // });

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

        // Should ETH balance decrease after deposit
        expect(ethBalanceAfterDeposit).to.be.eq(ethBalanceBeforeDeposit.sub(depositAmount));

        // Should LP balance increased after deposit
        expect(lpBalanceAfterDeposit).to.be.greaterThan(lpBalanceBeforeDeposit);

        console.log("LP added: ", lpBalanceAfterDeposit.sub(lpBalanceBeforeDeposit));
    });

    // it("[Withdraw] Should revert if withdraw amount is zero", async () => {
    //     await expect(vault.connect(alice).withdraw(0, false, daiToken.address)).to.be.revertedWith("Vault: Invalid withdraw amount");
    // });

    // it("[Withdraw] Should revert if trying to withdraw more than the deposited amount", async () => {
    //     const excessWithdrawAmount = ethers.utils.parseUnits("100", 'mwei').add(1);

    //     await expect(vault.connect(alice).withdraw(excessWithdrawAmount, false, daiToken.address)).to.be.revertedWith('Vault: Invalid withdraw amount');
    // });

    // it("[Withdraw] Should Alice withdraw and reward calculated correctly", async function () {
    //     await time.increase(24 * 3600); // 1 day

    //     const balance = BigNumber.from(await lpToken.balanceOf(alice.getAddress()));
    //     // console.log("Alice balance before withdraw: ", balance);

    //     const crvBalanceBeforeWithdraw = await crvToken.balanceOf(alice.getAddress());
    //     const cvxBalanceBeforeWithdraw = await cvxToken.balanceOf(alice.getAddress());
    //     // console.log(`Alice (CRV, CVX) rewards before withdraw: (${ crvBalanceBeforeWithdraw }, ${ cvxBalanceBeforeWithdraw })`);

    //     const withdrawAmount = ethers.utils.parseEther("100");
    //     // console.log("Alice withdraw amount: ", withdrawAmount);

    //     const pendingRewards = await vault.getPendingRewards(alice.getAddress());
    //     // console.log("Alice pending rewards: ", pendingRewards);

    //     await vault.connect(alice).withdraw(withdrawAmount);

    //     const balanceAfterWithdraw = await lpToken.balanceOf(alice.getAddress());
    //     expect(balanceAfterWithdraw).to.be.eq(balance.add(withdrawAmount));

    //     const crvBalanceAfterWithdraw = await crvToken.balanceOf(alice.getAddress());
    //     const cvxBalanceAfterWithdraw = await cvxToken.balanceOf(alice.getAddress());
    //     // console.log(`Alice (CRV, CVX) rewards after withdraw: (${ crvBalanceAfterWithdraw }, ${ cvxBalanceAfterWithdraw })`);

    //     const crvRewardEarned = crvBalanceAfterWithdraw - crvBalanceBeforeWithdraw;
    //     const cvxRewardEarned = cvxBalanceAfterWithdraw - cvxBalanceBeforeWithdraw;
    //     // console.log(`Alice (CRV, CVX) rewards: (${ crvRewardEarned }, ${ cvxRewardEarned })`);

    //     // console.log(crvRewardEarned - pendingRewards.crvPending);
    //     // console.log(cvxRewardEarned - pendingRewards.cvxPending);

    //     const crvDifferencePercentage = Math.abs((crvRewardEarned - pendingRewards.crvPending) / pendingRewards.crvPending) * 100;
    //     expect(crvDifferencePercentage).to.be.closeTo(0, 1);

    //     const cvxDifferencePercentage = Math.abs((cvxRewardEarned - pendingRewards.cvxPending) / pendingRewards.cvxPending) * 100;
    //     expect(cvxDifferencePercentage).to.be.closeTo(0, 1);
    // });

    // it("[Claim] Should successfully claim rewards", async () => {
    //     const balance = BigNumber.from(await lpToken.balanceOf(bob.getAddress()));
    //     // console.log("Bob balance before withdraw: ", balance);

    //     const crvBalanceBeforeWithdraw = await crvToken.balanceOf(bob.getAddress());
    //     const cvxBalanceBeforeWithdraw = await cvxToken.balanceOf(bob.getAddress());
    //     // console.log(`Bob (CRV, CVX) rewards before withdraw: (${ crvBalanceBeforeWithdraw }, ${ cvxBalanceBeforeWithdraw })`);

    //     const pendingRewards = await vault.getPendingRewards(bob.getAddress());
    //     // console.log("Bob pending rewards: ", pendingRewards);

    //     await vault.connect(bob).claim();

    //     const crvBalanceAfterWithdraw = await crvToken.balanceOf(bob.getAddress());
    //     const cvxBalanceAfterWithdraw = await cvxToken.balanceOf(bob.getAddress());
    //     // console.log(`Bob (CRV, CVX) rewards after withdraw: (${ crvBalanceAfterWithdraw }, ${ cvxBalanceAfterWithdraw })`);

    //     const crvRewardEarned = crvBalanceAfterWithdraw - crvBalanceBeforeWithdraw;
    //     const cvxRewardEarned = cvxBalanceAfterWithdraw - cvxBalanceBeforeWithdraw;
    //     // console.log(`Bob (CRV, CVX) rewards: (${ crvRewardEarned }, ${ cvxRewardEarned })`);

    //     // console.log(crvRewardEarned - pendingRewards.crvPending);
    //     // console.log(cvxRewardEarned - pendingRewards.cvxPending);

    //     const crvDifferencePercentage = Math.abs((crvRewardEarned - pendingRewards.crvPending) / pendingRewards.crvPending) * 100;
    //     expect(crvDifferencePercentage).to.be.closeTo(0, 1);

    //     const cvxDifferencePercentage = Math.abs((cvxRewardEarned - pendingRewards.cvxPending) / pendingRewards.cvxPending) * 100;
    //     expect(cvxDifferencePercentage).to.be.closeTo(0, 1);
    // });
});
