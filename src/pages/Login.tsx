import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import Loader from "@/components/icons/Loader";
import authService from "@/services/auth.service";
import { toast } from "sonner";
import qs from "qs";
import { AlertCircle, Delete } from "lucide-react";
import { useRef, useState } from "react";
import pocketbase from "@/lib/pocketbase";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import recordActivtyLog from "@/utils/recordActivtyLog";
import useSettings from "@/hooks/useSettings";

export function Login() {
  const [error, setError] = useState(undefined);

  const formSchema = z.object({
    username: z.string().min(1, { message: "Username is a required field" }),
    password: z.string().min(1, { message: "Passsword is a required field" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const navigate = useNavigate();

  const redirect = qs.parse(location.search, {
    ignoreQueryPrefix: true,
  })?.redirect;

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(undefined);
    return authService
      .signIn({
        username: values.username,
        password: values.password,
      })
      .then((e) => {
        if (redirect) {
          setTimeout(() => {
            navigate(redirect);
          }, 200);
        }
        recordActivtyLog({
          title: "User Login Success",
          event_type: "USER_LOGIN_SUCCESS",
          details: `User ${e.names} logged in successfully`,
          log_level: "INFO",
          user: e.id,
        });
      })
      .catch((e) => {
        setError("Username or password is wrong");
        toast.error(e.message);
        console.log(e.message);
      });
  }

  const { settings } = useSettings();

  return (
    <>
      <div className="container- bg-white relative h-dvh flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 z-30 bg-zinc-900 bg-opacity-80 backdrop-blur-sm" />
          <img
            className="absolute h-full w-full left-0 top-0 object-cover"
            src={pocketbase.files.getUrl(settings, settings?.login_background)}
            alt="#"
          />
          <div className="relative z-40">
            <Link to={"/"} className=" flex items-center text-lg font-medium">
              <img
                className="h-12"
                src={pocketbase.files.getUrl(settings, settings?.white_logo)}
                alt="#"
              />
            </Link>
            <div className="mt-8 flex flex-col gap-2">
              <p className="text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <span className="flex items-end gap-2">
                <span className="text-5xl font-medium">
                  {
                    new Date()
                      .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                      })
                      .split(" ")[0]
                  }
                </span>
                <span>
                  {
                    new Date()
                      .toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                      })
                      .split(" ")[1]
                  }
                </span>
              </span>
            </div>
          </div>
          <div className="relative z-40 mt-auto">
            <blockquote className="space-y-4 max-w-xl">
              <p className="text-base leading-8">
                Welcome to Restorant Management portal. Login into your account
                or contact adminstrator for support & assistance.
              </p>
              <footer className="text-sm">
                © {new Date().getFullYear()} Restorant Portal, Inc. All rights
                reserved.
              </footer>
            </blockquote>
          </div>
        </div>
        <>
          <div className="mx-auto py-24 flex flex-col justify-center space-y-6  xs:max-w-[350px]">
            <div className="flex flex-col items-center justify-center space-y-2 text-center">
              <div className="pb-2">
                <img
                  className="h-9"
                  src={pocketbase.files.getUrl(settings, settings?.logo)}
                  alt=""
                />
              </div>

              <h1 className="sm:text-lg mt-4 text-[15px] font-semibold tracking-tight">
                Welcome Back Again, to {settings?.company_name}
              </h1>
              <p className="text-[14.5px] text-slate-600 text-muted-foreground">
                Enter your username below to login your account
              </p>
            </div>
            {error && (
              <Alert
                variant="destructive"
                className="rounded-[3px] !mt-4  h-fit p-2 my-3-"
              >
                <AlertCircle className="h-4 -mt-[6px] w-4" />
                <AlertTitle className=" ml-2 !text-left">
                  <span className="text-[13.8px] leading-5">{error}</span>
                </AlertTitle>
              </Alert>
            )}

            <Form {...form}>
              <div className={cn("grid gap-6")}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-3">
                    <div className="grid gap-1">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Label className="sr-only" htmlFor="username">
                                Username
                              </Label>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Your username"
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid mb-3 gap-2">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Label className="sr-only" htmlFor="password">
                                Password
                              </Label>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Your password"
                                type="password"
                                {...field}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      disabled={
                        form.formState.disabled || form.formState.isSubmitting
                      }
                    >
                      {form.formState.isSubmitting && (
                        <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                      )}
                      Login Your Account
                    </Button>
                  </div>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                </div>
              </div>
            </Form>

            <p className="px-8 text-center leading-8 text-sm text-slate-500 text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                to="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </>
      </div>
    </>
  );
}

function VisualNumberKeyboard({ onComplete, otp, setOTP }) {
  const numInputs = 5;

  const inputRefs = Array(numInputs)
    .fill(null)
    .map((_, i) => useRef(null));

  const handleInputChange = (index, value) => {
    if (isNaN(value)) {
      return;
    }
    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    if (value !== "" && index < numInputs - 1) {
      inputRefs[index + 1].current.focus();
    }

    if (!newOTP.includes("") && onComplete) {
      onComplete(newOTP.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleKeyboardPress = (value) => {
    if (value === "backspace") {
      const nonEmptyInputs = otp.filter((digit) => digit !== "");
      const lastNonEmptyIndex = nonEmptyInputs.length - 1;
      if (lastNonEmptyIndex >= 0) {
        handleInputChange(lastNonEmptyIndex, "");
      }
    } else {
      const emptyInputIndex = otp.findIndex((digit) => digit === "");
      if (emptyInputIndex !== -1) {
        handleInputChange(emptyInputIndex, value);
      }
    }
  };

  return (
    <div className="h-full mt-2 flex flex-col bg-red-100-">
      <div className="flex-1">
        <div className="mt-3 mb-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <>
              {Array(numInputs)
                .fill(null)
                .map((_, index) => (
                  <input
                    key={index}
                    type="password"
                    inputMode="none"
                    className="xs:w-[45px] w-[38px] h-[38px] text-center xs:h-[45px] border hover:border-primary border-transparent rounded-md bg-slate-100"
                    value={otp[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={inputRefs[index]}
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
            </>
          </div>
        </div>
        <div className="grid mt-4 mb-0 sm:mb-5 w-full grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((e, i) => {
            return (
              <div key={i} className="flex items-center justify-center">
                <a
                  className="w-[50px] h-[50px] text-center cursor-pointer select-none text-slate-600 hover:bg-slate-100 rounded-md py-2 sm:py-3 text-lg font-medium"
                  onClick={() => handleKeyboardPress(e)}
                >
                  {e}
                </a>
              </div>
            );
          })}
          <div className="flex items-center justify-center">
            <a
              onClick={() => handleKeyboardPress(".")}
              className="w-[45px] h-[45px] text-center pointer-events-none cursor-pointer select-none text-slate-600 hover:bg-slate-100 rounded-md py-2 sm:py-3 text-lg font-medium"
            >
              .
            </a>
          </div>
          <div className="flex items-center justify-center">
            <a
              className="w-[50px] h-[50px] text-center cursor-pointer select-none text-slate-600 hover:bg-slate-100 rounded-md py-2 sm:py-3 text-lg font-medium"
              onClick={() => handleKeyboardPress(0)}
            >
              0
            </a>
          </div>
          <div className="flex items-center justify-center">
            <a
              className="w-[50px] h-[50px] text-center cursor-pointer select-none flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md py-2 sm:py-3 text-lg font-medium"
              onClick={() => handleKeyboardPress("backspace")}
            >
              <Delete size={22} className="text-slate-600 " />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
