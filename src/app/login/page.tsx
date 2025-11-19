'use client';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { handleLogin } from './actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [state, formAction] = useFormState(handleLogin, { error: null });

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm mx-auto shadow-lg">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <Logo />
                    </div>
                    <CardTitle className="text-2xl font-headline">Login</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {state?.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
