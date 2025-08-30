"use client";

import { useRef } from "react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SubmitButton from "./SubmitButton";
import { createGoal } from "../actions";

export default function GoalForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createGoal(formData);
        formRef.current?.reset();
      }}
    >
      <CardContent>
        <Input name="goal" className="bg-white" required />
      </CardContent>
      <CardFooter>
        <SubmitButton />
      </CardFooter>
    </form>
  );
}
