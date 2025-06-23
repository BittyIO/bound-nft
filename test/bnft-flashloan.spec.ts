import { TestEnv, makeSuite } from "./helpers/make-suite";
import { MockFlashLoanReceiver } from "../types/MockFlashLoanReceiver";
import { MockBNFTMinter } from "../types/MockBNFTMinter";
import { deployMockBNFTMinter, deployMockFlashLoanReceiver } from "../helpers/contracts-deployments";
import { waitForTx } from "../helpers/misc-utils";

const { expect } = require("chai");

makeSuite("BNFT: FlashLoan function", (testEnv: TestEnv) => {
  let _mockFlashLoanReceiver = {} as MockFlashLoanReceiver;
  let _mockBNFTMinter = {} as MockBNFTMinter;
  let _mockBNFTMinter2 = {} as MockBNFTMinter;
  let user0TokenId1 = {} as string;
  let user0TokenId2 = {} as string;
  let user1TokenId1 = {} as string;
  let user2TokenId1 = {} as string;

  before(async () => {
    const { bayc, bBAYC, bnftRegistry } = testEnv;

    _mockFlashLoanReceiver = await deployMockFlashLoanReceiver([bnftRegistry.address]);
    _mockBNFTMinter = await deployMockBNFTMinter([bayc.address, bBAYC.address]);
    _mockBNFTMinter2 = await deployMockBNFTMinter([bayc.address, bBAYC.address]);
    await waitForTx(await bBAYC.setFlashLoanReceiverWhitelist(_mockFlashLoanReceiver.address, true));
  });

  afterEach(async () => {
    await _mockFlashLoanReceiver.clearAllSimulate();
  });

  it("Mints NFT into the BNFT", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await bayc.connect(users[0].signer).setApprovalForAll(_mockBNFTMinter.address, true);
    await bayc.connect(users[1].signer).setApprovalForAll(_mockBNFTMinter.address, true);

    testEnv.tokenIdTracker++;
    user0TokenId1 = testEnv.tokenIdTracker.toString();
    await bayc.connect(users[0].signer).mint(user0TokenId1);
    await _mockBNFTMinter.connect(users[0].signer).mint(users[0].address, user0TokenId1);

    testEnv.tokenIdTracker++;
    user0TokenId2 = testEnv.tokenIdTracker.toString();
    await bayc.connect(users[0].signer).mint(user0TokenId2);
    await _mockBNFTMinter.connect(users[0].signer).mint(users[0].address, user0TokenId2);

    testEnv.tokenIdTracker++;
    user1TokenId1 = testEnv.tokenIdTracker.toString();
    await bayc.connect(users[1].signer).mint(user1TokenId1);
    await _mockBNFTMinter.connect(users[1].signer).mint(users[1].address, user1TokenId1);
  });

  it("Takes flashloan using one token, returns the tokens correctly", async () => {
    const { users, bayc, bBAYC } = testEnv;

    const ownerBefore = await bayc.ownerOf(user0TokenId1);
    expect(ownerBefore).to.be.equal(bBAYC.address);
    const ownerBeforeB = await bBAYC.ownerOf(user0TokenId1);
    expect(ownerBeforeB).to.be.equal(users[0].address);

    await bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], []);

    const ownerAfter = await bayc.ownerOf(user0TokenId1);
    expect(ownerAfter).to.be.equal(bBAYC.address);
    const ownerAfterB = await bBAYC.ownerOf(user0TokenId1);
    expect(ownerAfterB).to.be.equal(users[0].address);
  });

  it("Takes flashloan using many tokens, returns the tokens correctly", async () => {
    const { users, bayc, bBAYC } = testEnv;

    const ownerBefore1 = await bayc.ownerOf(user0TokenId1);
    expect(ownerBefore1).to.be.equal(bBAYC.address);
    const ownerBeforeB1 = await bBAYC.ownerOf(user0TokenId1);
    expect(ownerBeforeB1).to.be.equal(users[0].address);

    const ownerBefore2 = await bayc.ownerOf(user0TokenId2);
    expect(ownerBefore2).to.be.equal(bBAYC.address);
    const ownerBeforeB2 = await bBAYC.ownerOf(user0TokenId2);
    expect(ownerBeforeB2).to.be.equal(users[0].address);

    await bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1, user0TokenId2], []);

    const ownerAfter1 = await bayc.ownerOf(user0TokenId1);
    expect(ownerAfter1).to.be.equal(bBAYC.address);
    const ownerAfterB1 = await bBAYC.ownerOf(user0TokenId1);
    expect(ownerAfterB1).to.be.equal(users[0].address);

    const ownerAfter2 = await bayc.ownerOf(user0TokenId2);
    expect(ownerAfter2).to.be.equal(bBAYC.address);
    const ownerAfterB2 = await bBAYC.ownerOf(user0TokenId2);
    expect(ownerAfterB2).to.be.equal(users[0].address);
  });

  it("Takes flashloan, does not return all the tokens. (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setTokenIdNotToApprove(user0TokenId1);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], [])
    ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
  });

  it("Takes flashloan, does not return partly the tokens. (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setTokenIdNotToApprove(user0TokenId2);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1, user0TokenId2], [])
    ).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
  });

  it("Tries to take a flashloan using not owned tokens (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user1TokenId1], [])
    ).to.be.revertedWith("BNFT: caller without permission");
  });

  it("Takes flashloan, simulating receiver execution failed (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setFailExecution(true);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], [])
    ).to.be.revertedWith("BNFT: invalid flashloan executor return");
  });

  it("tries to take a flashloan using non contract address as receiver (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await expect(bBAYC.connect(users[0].signer).flashLoan(users[1].address, [user0TokenId1], [])).to.be.revertedWith(
      ""
    );
  });

  it("Tries to take a flashloan reentry BNFT contract mint (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setSimulateCallBNFT(1, 0);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], [])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Tries to take a flashloan reentry BNFT burn (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setSimulateCallBNFT(2, 0);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], [])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Tries to take a flashloan reentry BNFT flashloan with mode 3 (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setSimulateCallBNFT(3, user0TokenId1);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], [])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Tries to take a flashloan reentry BNFT flashloan with mode 4 (revert expected)", async () => {
    const { users, bayc, bBAYC } = testEnv;

    await _mockFlashLoanReceiver.setSimulateCallBNFT(4, user0TokenId2);

    await expect(
      bBAYC.connect(users[0].signer).flashLoan(_mockFlashLoanReceiver.address, [user0TokenId1], [])
    ).to.be.revertedWith("ReentrancyGuard: reentrant call");
  });

  it("Tries to take a flashloan by approved contract", async () => {
    const { users, bayc, bBAYC } = testEnv;
    const user2 = users[2];

    testEnv.tokenIdTracker++;
    user2TokenId1 = testEnv.tokenIdTracker.toString();
    await waitForTx(await bayc.connect(user2.signer).mint(user2TokenId1));
    await waitForTx(await bayc.connect(user2.signer).setApprovalForAll(bBAYC.address, true));
    await waitForTx(await bBAYC.connect(user2.signer).mint(user2.address, user2TokenId1));

    console.log("revert expected before approved");
    await expect(_mockBNFTMinter.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], [])).to.be.revertedWith(
      "BNFT: caller without permission"
    );

    console.log("add approve flash loan to the mock contract");
    await waitForTx(await bBAYC.connect(user2.signer).setFlashLoanApproval(_mockBNFTMinter.address, true));
    const approved = await bBAYC.isFlashLoanApproved(user2.address, _mockBNFTMinter.address);
    expect(approved).to.be.equal(true);

    console.log("success expected after approved");
    await waitForTx(await _mockBNFTMinter.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], []));

    console.log("remove approve flash loan to the mock contract");
    await waitForTx(await bBAYC.connect(user2.signer).setFlashLoanApproval(_mockBNFTMinter.address, false));
    const approved2 = await bBAYC.isFlashLoanApproved(user2.address, _mockBNFTMinter.address);
    expect(approved2).to.be.equal(false);

    await expect(_mockBNFTMinter.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], [])).to.be.revertedWith(
      "BNFT: caller without permission"
    );
  });

  it("Tries to take a flashloan by locked contract", async () => {
    const { users, bayc, bBAYC } = testEnv;
    const user2 = users[2];

    // reuse user2TokenId1 in previous testcase

    console.log("mock contract should revert expected after locked");
    await expect(_mockBNFTMinter2.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], [])).to.be.revertedWith(
      "BNFT: caller without permission"
    );

    console.log("lock flash loan to the mock contract");
    await waitForTx(
      await bBAYC.connect(user2.signer).setFlashLoanLocking(user2TokenId1, _mockBNFTMinter2.address, true)
    );
    const locked = await bBAYC.isFlashLoanLocked(user2TokenId1, user2.address, _mockBNFTMinter2.address);
    expect(locked).to.be.equal(true);
    const lockedAddresses = await bBAYC.getFlashLoanLocked(user2TokenId1, user2.address);
    expect(lockedAddresses.length).to.be.equal(1);
    expect(lockedAddresses[0]).to.be.equal(_mockBNFTMinter2.address);

    console.log("user2 should revert expected after locked");
    await expect(
      bBAYC.connect(user2.signer).flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], [])
    ).to.be.revertedWith("BNFT: caller without permission");

    console.log("unlocked mock contract should revert expected after locked");
    await expect(_mockBNFTMinter.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], [])).to.be.revertedWith(
      "BNFT: caller without permission"
    );

    console.log("locked mock contract should success expected after locked");
    await waitForTx(await _mockBNFTMinter2.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], []));

    console.log("unlock flash loan to the mock contract");
    await waitForTx(
      await bBAYC.connect(user2.signer).setFlashLoanLocking(user2TokenId1, _mockBNFTMinter2.address, false)
    );
    const locked2 = await bBAYC.isFlashLoanLocked(user2TokenId1, user2.address, _mockBNFTMinter2.address);
    expect(locked2).to.be.equal(false);
    const lockedAddresses2 = await bBAYC.getFlashLoanLocked(user2TokenId1, user2.address);
    expect(lockedAddresses2.length).to.be.equal(0);

    await expect(_mockBNFTMinter2.flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], [])).to.be.revertedWith(
      "BNFT: caller without permission"
    );

    console.log("user2 should success expected after approved");
    await waitForTx(await bBAYC.connect(user2.signer).flashLoan(_mockFlashLoanReceiver.address, [user2TokenId1], []));
  });
});
