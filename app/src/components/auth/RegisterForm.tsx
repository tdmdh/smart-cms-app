'use client';

import { useRegister } from "@/src/hooks/auth/useRegister";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardActions,
    Button,
    MultiStepForm,
    Icon,
} from "../shared/ui";
import { PersonalInfoStep, AccountStep, registerSteps } from "./RegisterSteps";
import Link from "next/link";
import { Activity, useState } from "react";
import { BlurFade } from "../shared/ui/BlurGsap";

export const RegisterForm = () => {
    const [showRegisterForm, SetShowRegisterForm] = useState(false);
    const {
        formData,
        formErrors,
        isLoading,
        currentStep,
        setCurrentStep,
        handleChange,
        handleSubmit,
        validateStep,
    } = useRegister();

    const handleComplete = () => {
        handleSubmit();
    };



    return (
        <div>
            <Card variant="transparent" className="w-100 flex flex-col" >
                <span className="text-4xl mb-4 mx-auto text-center font-extrabold p-3 bg-white text-black rounded-full" >
                    <Icon name={'apple'} size={48} aria-label="App Logo" aria-hidden={false} />
                </span>
                <CardHeader
                    title="Create Account"
                    subtitle={registerSteps[currentStep]?.subtitle || "Register now to get started"}
                />
                <CardBody>
                    <Activity mode={showRegisterForm ? "hidden" : "visible"} >
                        <div className=" flex flex-col gap-2">
                            <Button variant="accent" size="md" onClick={() => SetShowRegisterForm(true)} >Register with email</Button>
                            <Button variant="outline" fullWidth iconSize={20} rightIcon={'google'} onClick={() => window.location.href = '/api/auth/oauth/google'}>Connect with</Button>
                            <Button variant="outline" fullWidth iconSize={20} rightIcon={'github'} onClick={() => window.location.href = '/api/auth/oauth/github'}>Connect with</Button>
                        </div>
                    </Activity>
                    {showRegisterForm && (
                        <BlurFade duration={0.25}>
                            <MultiStepForm
                                steps={registerSteps}
                                currentStep={currentStep}
                                onStepChange={setCurrentStep}
                                onComplete={handleComplete}
                                validateStep={validateStep}
                                isSubmitting={isLoading}
                                submitLabel="Create Account"
                                showProgress={true}
                                showDots={true}
                            >
                                <PersonalInfoStep
                                    data={formData}
                                    errors={formErrors}
                                    onChange={handleChange}
                                />
                                <AccountStep
                                    data={formData}
                                    errors={formErrors}
                                    onChange={handleChange}
                                />
                            </MultiStepForm>
                        </BlurFade>
                    )}
                </CardBody>
            </Card>

            <CardFooter>
                <CardActions>
                    <Activity mode={showRegisterForm ? "visible" : "hidden"}>
                        <Button  variant="ghost" size="md"  leftIcon='chevron-left' iconSize={14} onClick={() => SetShowRegisterForm(false)}>Other methods</Button>
                    </Activity>
                    <Button  variant="outline">
                        <Link href="/login">
                            Already have an account?
                        </Link>
                    </Button>
                </CardActions>
            </CardFooter>
        </div>
    );
};

export default RegisterForm;