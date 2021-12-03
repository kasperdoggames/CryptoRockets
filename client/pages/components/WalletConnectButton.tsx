import eth from "../../support/eth";

function WalletConnectButton({ onConnect }) {
  return (
    <button
      onClick={onConnect}
      className="px-4 py-2 text-white bg-green-600 border-4 border-yellow-500 rounded-2xl"
    >
      Connect to Wallet
    </button>
  );
}

export default WalletConnectButton;
