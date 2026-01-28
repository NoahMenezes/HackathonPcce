"use client";

import React from "react";
import { useCallback, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon, PhoneIcon, PhoneOffIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Orb } from "@/components/ui/orb";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { ProtectedRoute } from "@/components/protected-route";

const DEFAULT_AGENT = {
  agentId:
    process.env.NEXT_PUBLIC_AGENT_ID || "agent_8701kfjzrrhcf408keqd06k3pryw",
  name: "City Assistant",
  description: "Your AI-powered civic assistant",
};

type AgentState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | null;

function VoiceChatInterface() {
  const [agentState, setAgentState] = useState<AgentState>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => console.log("Connected to voice agent"),
    onDisconnect: () => console.log("Disconnected from voice agent"),
    onMessage: (message) => console.log("Voice message:", message),
    onError: (error) => {
      console.error("Voice agent error:", error);
      setAgentState("disconnected");
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setErrorMessage(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: DEFAULT_AGENT.agentId,
        connectionType: "webrtc",
        onStatusChange: (status) => setAgentState(status.status),
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setAgentState("disconnected");
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setErrorMessage(
          "Please enable microphone permissions in your browser.",
        );
      }
    }
  }, [conversation]);

  const handleCall = useCallback(() => {
    if (agentState === "disconnected" || agentState === null) {
      setAgentState("connecting");
      startConversation();
    } else if (agentState === "connected") {
      conversation.endSession();
      setAgentState("disconnected");
    }
  }, [agentState, conversation, startConversation]);

  const isCallActive = agentState === "connected";
  const isTransitioning =
    agentState === "connecting" || agentState === "disconnecting";

  const getInputVolume = useCallback(() => {
    const rawValue = conversation.getInputVolume?.() ?? 0;
    return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5);
  }, [conversation]);

  const getOutputVolume = useCallback(() => {
    const rawValue = conversation.getOutputVolume?.() ?? 0;
    return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5);
  }, [conversation]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-12 px-4">
      {/* Large centered orb */}
      <div className="relative">
        <div className="relative size-72 md:size-96">
          <div className="bg-muted relative h-full w-full rounded-full p-3 shadow-[inset_0_2px_16px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_2px_16px_rgba(0,0,0,0.6)]">
            <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]">
              <Orb
                className="h-full w-full"
                volumeMode="manual"
                getInputVolume={getInputVolume}
                getOutputVolume={getOutputVolume}
                agentState={
                  agentState === "connected"
                    ? "talking"
                    : agentState === "connecting"
                      ? "thinking"
                      : null
                }
                colors={["#3b82f6", "#1d4ed8"]}
              />
            </div>
          </div>
        </div>

        {/* Pulsing ring when active */}
        {isCallActive && (
          <motion.div
            className="absolute inset-0 -z-10 rounded-full bg-blue-500/20 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Agent info and status */}
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-black dark:text-white md:text-5xl">
          {DEFAULT_AGENT.name}
        </h1>

        <AnimatePresence mode="wait">
          {errorMessage ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-destructive text-center text-base max-w-md"
            >
              {errorMessage}
            </motion.p>
          ) : agentState === "disconnected" || agentState === null ? (
            <motion.p
              key="disconnected"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-muted-foreground text-center text-lg max-w-md"
            >
              {DEFAULT_AGENT.description}
            </motion.p>
          ) : (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-3 text-lg"
            >
              <div
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-300",
                  agentState === "connected" && "bg-green-500 animate-pulse",
                  isTransitioning && "bg-primary/60 animate-pulse",
                )}
              />
              <span className="font-medium capitalize">
                {isTransitioning ? (
                  <ShimmeringText text={agentState} />
                ) : (
                  <span className="text-green-600 dark:text-green-400">
                    Connected
                  </span>
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text when not connected */}
        {(agentState === "disconnected" || agentState === null) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-center text-sm max-w-sm mt-2"
          >
            Tap the button below to start a voice conversation. I can help you
            report issues, check status, and navigate the platform.
          </motion.p>
        )}
      </div>

      {/* Call button */}
      <Button
        onClick={handleCall}
        disabled={isTransitioning}
        size="lg"
        variant={isCallActive ? "destructive" : "default"}
        className={cn(
          "h-20 w-20 rounded-full shadow-lg transition-all hover:scale-105",
          isCallActive && "bg-red-500 hover:bg-red-600",
        )}
      >
        <AnimatePresence mode="wait">
          {isTransitioning ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              }}
            >
              <Loader2Icon className="h-8 w-8" />
            </motion.div>
          ) : isCallActive ? (
            <motion.div
              key="end"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <PhoneOffIcon className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Mic className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Quick tips */}
      {isCallActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        >
          <p className="text-sm text-muted-foreground max-w-md">
            🎤 I&apos;m listening... Speak naturally to report issues or ask
            questions
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function VoiceAgentPage() {
  return (
    <ProtectedRoute>
      <VoiceAgentContent />
    </ProtectedRoute>
  );
}

function VoiceAgentContent() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-black dark:via-gray-950 dark:to-black">
      <VoiceChatInterface />
    </div>
  );
}
