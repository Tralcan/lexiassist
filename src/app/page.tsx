'use client';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookLock, MessageSquare } from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Asistencia Legal Potenciada por IA
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline">
                  LexiAssist
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Tu asistente legal virtual que utiliza modelos RAG para ofrecerte respuestas precisas y contextualizadas basadas en la legislación chilena.
                </p>
              </div>
              <div className="grid gap-4 md:gap-8">
                  <Link href="/chat">
                    <div className="flex flex-col items-start gap-4 rounded-lg border p-6 text-left text-sm transition-all hover:bg-accent">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary text-primary-foreground rounded-lg p-3 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold">Acceso Cliente</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Realiza tus consultas legales y obtén asistencia inmediata a través de nuestro chat interactivo.
                      </p>
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <span>Ir al Chat</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>

                  <Link href="/admin">
                    <div className="flex flex-col items-start gap-4 rounded-lg border p-6 text-left text-sm transition-all hover:bg-accent">
                      <div className="flex items-center gap-4">
                        <div className="bg-secondary text-secondary-foreground rounded-lg p-3 flex items-center justify-center">
                          <BookLock className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold">Acceso Administrador</h3>
                      </div>
                      <p className="text-muted-foreground">
                        Gestiona usuarios y la base de conocimiento que alimenta nuestro sistema de inteligencia artificial.
                      </p>
                      <div className="flex items-center gap-2 text-primary font-semibold">
                        <span>Ir al Panel</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center h-16 border-t bg-white">
          <p className="text-sm text-muted-foreground">&copy; 2024 LexiAssist. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
