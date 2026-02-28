import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { attack as attackTx, deposit as depositTx } from '../utils/contract';

/** useTx — wraps every on-chain call with toast state management */
export default function useTx() {
  const [pending, setPending] = useState(false);

  const explorerUrl = (hash) =>
    `https://testnet.monadexplorer.com/tx/${hash}`;

  const wrapTx = useCallback(async (label, fn) => {
    setPending(true);
    const toastId = toast.loading(`${label}…`);
    try {
      const tx = await fn();
      const receipt = await tx.wait();
      toast.success(
        (t) => (
          <span>
            {label} confirmed!{' '}
            <a
              href={explorerUrl(receipt.hash)}
              target="_blank"
              rel="noreferrer"
              className="underline text-[#8147FF]"
            >
              View Tx ↗
            </a>
          </span>
        ),
        { id: toastId, duration: 5000 }
      );
      return receipt;
    } catch (err) {
      const msg = err?.reason || err?.message?.slice(0, 80) || 'Transaction failed';
      toast.error(msg, { id: toastId, duration: 8000 });
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  /** Attack a castle */
  const sendAttack = useCallback(async (signer, castleId, mainWallet) => {
    return wrapTx(`⚔️ Attacking Castle ${castleId + 1}`, () =>
      attackTx(signer, castleId, mainWallet)
    );
  }, [wrapTx]);

  /** Deposit MON */
  const sendDeposit = useCallback(async (signer, amountEther) => {
    return wrapTx(`⬆ Depositing ${amountEther} MON`, () =>
      depositTx(signer, amountEther)
    );
  }, [wrapTx]);

  return { pending, sendAttack, sendDeposit, wrapTx };
}
