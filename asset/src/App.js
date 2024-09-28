import React, { useState } from 'react';
import { ethers } from 'ethers'; // Import ethers
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';

const contractAddress = "0x9ad7849D49dE517c39E99222C9088e51A67f9a0B"; // Replace with your deployed contract address
const contractABI = [
  "function transferEth(address payable _to, uint256 _amount) public payable"
];

const App = () => {
  const [account, setAccount] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        console.log("Connected account:", accounts[0]);
      } catch (error) {
        console.error("Connection error:", error);
      }
    } else {
      alert("MetaMask not detected");
    }
  };

  const isValidAddress = (address) => {
    return ethers.getAddress(address); // Use ethers.getAddress() instead of ethers.utils.isAddress()
  };

  const transferVoltaETH = async () => {
    if (!recipientAddress || !ethAmount) {
      alert("Please enter both recipient address and amount.");
      return;
    }

    if (!isValidAddress(recipientAddress)) {
      alert("Invalid recipient address.");
      return;
    }

    setIsLoading(true);

    try {
      const amountInWei = ethers.parseUnits(ethAmount, 18); // Updated to use ethers.parseUnits()

      const provider = new ethers.BrowserProvider(window.ethereum); // Updated to use ethers.BrowserProvider
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(contractAddress, contractABI, signer); // Updated to use ethers.Contract

      const transaction = await contract.transferEth(recipientAddress, amountInWei, { value: amountInWei });
      await transaction.wait();

      alert(`Successfully sent ${ethAmount} ETH to ${recipientAddress}`);

      const transferDetails = {
        from: account,
        to: recipientAddress,
        amount: ethAmount,
        timestamp: new Date().toLocaleString(),
      };

      const storedTransfers = JSON.parse(localStorage.getItem('transfers')) || [];
      storedTransfers.push(transferDetails);
      localStorage.setItem('transfers', JSON.stringify(storedTransfers));

      setRecipientAddress('');
      setEthAmount('');

    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed, see console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
      <div className="app-container">
        <div className="card">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h2 className="title">Asset Transfer</h2>

                  {!account ? (
                    <button className="connect-button" onClick={connectWallet}>Connect MetaMask</button>
                  ) : (
                    <div>
                      <p className="account-info">Connected Account: {account}</p>

                      <div className="section">
                        <h3 className="section-title">Transfer VoltaETH</h3>
                        <input
                          type="text"
                          placeholder="Recipient Address"
                          className="input-field"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Amount in ETH"
                          className="input-field"
                          value={ethAmount}
                          onChange={(e) => setEthAmount(e.target.value)}
                        />
                        <button className="send-button" onClick={transferVoltaETH} disabled={isLoading}>
                          {isLoading ? 'Sending...' : 'Send ETH'}
                        </button>
                      </div>
                      <Link className="styled-link" to="/transfer-history">View Asset Transfers</Link>
                    </div>
                  )}
                </div>
              }
            />
            <Route path="/transfer-history" element={<TransferHistory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

const TransferHistory = () => {
  const storedTransfers = JSON.parse(localStorage.getItem('transfers')) || [];

  return (
    <div className="history-container">
      <h2>Asset Transfer History</h2>
      {storedTransfers.length > 0 ? (
        <table className="history-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount (ETH)</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {storedTransfers.map((transfer, index) => (
              <tr key={index}>
                <td>{transfer.from}</td>
                <td>{transfer.to}</td>
                <td>{transfer.amount}</td>
                <td>{transfer.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-transfers">No transfers found.</p>
      )}
      <Link className="styled-link" to="/">Go Back</Link>
    </div>
  );
};

export default App;
