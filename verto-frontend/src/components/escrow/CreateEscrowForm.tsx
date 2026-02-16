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
  readEscrowCount,
} from "@/lib/stacks";
import type { Escrow } from "@/types";

const escrowSchema = z.object({
  freelancerAddress: z.string().min(1, "Freelancer address is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  projectDescription: z.string().min(1, "Description is required"),
});

type EscrowFormData = z.infer<typeof escrowSchema>;

interface CreateEscrowFormProps {
  onSuccess: () => void;
}

export default function CreateEscrowForm({ onSuccess }: CreateEscrowFormProps) {
  const { addEscrow } = useEscrowStore();
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
      // Convert STX to microstacks for the contract
      const amountMicrostacks = stxToMicrostacks(data.amount);

      // Get the current on-chain count BEFORE creating (this will be the new escrow's ID)
      const currentCount = await readEscrowCount();

      // Call the smart contract
      // Contract: create-escrow(freelancer, amount, invoice-hash)
      // contract-caller = client (the person creating/paying)
      // freelancer = the person doing the work
      const txId = await contractCreateEscrow(
        data.freelancerAddress,
        amountMicrostacks,
      );

      if (txId) {
        const escrow: Escrow = {
          id: generateId(),
          escrowId: currentCount, // The on-chain escrow ID
          clientAddress: address || "", // Caller = client
          freelancerAddress: data.freelancerAddress, // Entered = freelancer
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
        label="Freelancer Wallet Address"
        placeholder="ST... (the person doing the work)"
        hint="You (the caller) are the client who will fund the escrow."
        error={errors.freelancerAddress?.message}
        {...register("freelancerAddress")}
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
