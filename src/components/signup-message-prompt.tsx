import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

export const SignupMessagePrompt = () => {
  const router = useRouter();

  const handleNavigation = () => {
    router.replace("/auth/sign-up");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="isolate mx-auto flex max-w-md flex-col items-center justify-center md:p-8"
    >
      <div className="z-2 mb-8 space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border dark:border-0">
            Logo
          </div>
          <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Deepsearch
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium italic">
            build with ❤️
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex w-full gap-3"
      >
        <Button
          onClick={handleNavigation}
          variant="secondary"
          className="min-w-64 font-medium transition-all hover:scale-102 active:scale-98"
          size="lg"
        >
          Get Started
        </Button>
      </motion.div>
    </motion.div>
  );
};
