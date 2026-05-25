import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || "http://localhost:8000");
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginDemo } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const from = location.state?.from?.pathname || "/";

    const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiUrl(e.target.value);
    };

    const saveApiUrl = () => {
        localStorage.setItem('api_url', apiUrl);
        toast({
            title: "API URL Saved",
            description: "Reloading page to apply changes...",
        });
        setTimeout(() => window.location.reload(), 1000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login({ email, password });
            toast({
                title: "Login successful",
                description: "Welcome back!",
            });
            navigate(from, { replace: true });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Login failed",
                description: "Please check your credentials and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email and password below to login
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign in"}
                        </Button>
                        <Button
                            className="w-full"
                            variant="outline"
                            type="button"
                            onClick={async () => {
                                setIsLoading(true);
                                await loginDemo();
                                navigate(from, { replace: true });
                            }}
                            disabled={isLoading}
                        >
                            Try Demo (No Backend)
                        </Button>

                        <div className="mt-4 w-full pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="apiUrl" className="text-xs text-muted-foreground">API URL (Backend)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="apiUrl"
                                        type="text"
                                        className="text-xs h-8"
                                        placeholder="http://localhost:8000"
                                        value={apiUrl}
                                        onChange={handleApiUrlChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={saveApiUrl}
                                    >
                                        Save
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Use this for Ngrok or remote backend. Default: http://localhost:8000
                                </p>
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
