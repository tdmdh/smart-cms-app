'use client';
import { useLogin } from "@/src/hooks/auth/useLogin";
import {
    Form,
    FormActions,
    FormRow,
    FormLabel,
    FormGroup,
    FormControl,
    FormInput,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardActions,
    Button,
    BlurFadeGsap as BlurFade,
} from "../shared/ui";
import Link from "next/link";
import { Activity, useState } from "react";



export const LoginForm = () => {
    const [showLoginForm, setShowLoginForm] = useState(false);
    const {
        formData,
        formErrors,
        isLoading,
        handleChange,
        handleSubmit,
    } = useLogin();


    return (
        <div className="flex items-center justify-center flex-col">
            <Card variant="transparent" className="w-100 flex flex-col" >
                <span className="text-4xl mb-4 mx-auto text-center font-extrabold p-3 bg-white text-black rounded-full" >
                    SCMS
                </span>
                <CardHeader
                    title="Welcome Back"
                    subtitle="Login to your account"
                />
                <CardBody>

                    <Activity mode={showLoginForm ? 'hidden' : 'visible'} >
                        <div className="flex flex-col  gap-2" >
                            <Button variant="accent" fullWidth size="md" onClick={() => setShowLoginForm(true)}>Login with email</Button>
                            <Button variant="outline" fullWidth size="md" iconSize={20} rightIcon="google" onClick={() => window.location.href = '/api/auth/oauth/google'}>Connect with</Button>
                            <Button variant="outline" fullWidth size="md" iconSize={20} rightIcon="github" onClick={() => window.location.href = '/api/auth/oauth/github'}>Connect with</Button>
                            <Button variant="outline" fullWidth size="md" iconSize={20} rightIcon="key" >Login with passkey</Button>
                        </div>
                    </Activity>

                    {showLoginForm && (
                        <BlurFade duration={0.5} >
                            <Form onSubmit={handleSubmit}>
                                <FormRow>
                                    <FormGroup>
                                        <FormLabel>
                                            Enter your email or username
                                        </FormLabel>
                                        <FormControl>
                                            <FormInput
                                                placeholder="email or username"
                                                type="identifier"
                                                name="identifier"
                                                value={formData.identifier}
                                                onChange={handleChange}
                                                error={formErrors.identifier}
                                            />
                                        </FormControl>
                                    </FormGroup>
                                </FormRow>
                                <FormRow>
                                    <FormGroup>
                                        <FormLabel>
                                            Enter your password
                                        </FormLabel>
                                        <FormControl>
                                            <FormInput
                                                placeholder="●●●●●●●"
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                error={formErrors.password}

                                            />
                                        </FormControl>
                                    </FormGroup>
                                </FormRow>
                                <FormActions>
                                    <Button
                                        fullWidth
                                        type="submit"
                                        size="md"
                                        loading={isLoading}
                                    >
                                        Login
                                    </Button>
                                </FormActions>

                                <FormActions>
                                </FormActions>
                            </Form>
                        </BlurFade>
                    )}
                </CardBody>
            </Card>
            <CardFooter>
                <CardActions>
                    <Activity mode={showLoginForm ? 'visible' : 'hidden'}>
                        <Button leftIcon='chevron-left' iconSize={14} variant="ghost" onClick={() => setShowLoginForm(false)}>Other methods</Button>
                    </Activity>
                    <Button variant="outline">
                        <Link
                            href="/register"
                        >
                            Don't have an account?
                        </Link>
                    </Button>
                </CardActions>
            </CardFooter>
        </div>
    )
};