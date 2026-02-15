"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useEscrowStore } from "@/stores/useEscrowStore";
import { useWalletStore } from "@/stores/useWalletStore";
import { generateId } from "@/lib/utils";
import {
  contractCreateEscrow,
  stxToMicrostacks,
  getExplorerTxUrl,
} from "@/lib/stacks";
import { usdToBtc, fetchBtcPrice } from "@/lib/price";
import type { Escrow } from "@/types";

const escrowSchema = z.object({
  clientAddress: z.string().min(1, "Client address is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  projectDescription: z.string().min(1, "Description is required"),
});

type EscrowFormData = z.infer<typeof escrowSchema>;

interface CreateEscrowFormProps {
  onSuccess: () => void;
}

export default function CreateEscrowForm({ onSuccess }: CreateEscrowFormProps) {
  const { addEscrow, escrows } = useEscrowStore();
  const { address } = useWalletStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EscrowFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(escrowSchema) as any,
  });

  const onSubmit = async (data: EscrowFormData) => {
    setIsSubmitting(true);
    try {
      // Convert USD to microstacks (using STX for the contract)
      const amountMicrostacks = stxToMicrostacks(data.amount);

      // Call the smart contract
      const txId = await contractCreateEscrow(
        data.clientAddress,
        amountMicrostacks,
      );

      if (txId) {
        // Get BTC equivalent for display
        const btcEquiv = await usdToBtc(data.amount);

        const escrow: Escrow = {
          id: generateId(),
          escrowId: escrows.length,
          clientAddress: data.clientAddress,
          freelancerAddress: address || "",
          amount: data.amount,
          amountUsd: data.amount,
          amountStx: amountMicrostacks,
          status: "created",
          projectDescription: data.projectDescription,
          createdAt: new Date().toISOString(),
          txId,
        };

        addEscrow(escrow);
        toast.success("Escrow contract created!", {
          description: "Transaction submitted. Waiting for client to fund.",
          action: {
            label: "View TX",
            onClick: () => window.open(getExplorerTxUrl(txId), "_blank"),
          },
        });
        onSuccess();
      } else {
        toast.info("Transaction cancelled by user.");
      }
    } catch (error) {
      toast.error("Failed to create escrow", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Client Wallet Address"
        placeholder="SP... or ST..."
        error={errors.clientAddress?.message}
        {...register("clientAddress")}
      />
      <Input
        label="Amount (STX)"
        type="number"
        step="0.01"
        placeholder="100.00"
        hint="Amount in STX tokens to lock in escrow"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />
      <Textarea
        label="Project Description"
        placeholder="Describe the scope of work for this escrow..."
        error={errors.projectDescription?.message}
        {...register("projectDescription")}
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          Create Escrow
        </Button>
      </div>
    </form>
  );
}
