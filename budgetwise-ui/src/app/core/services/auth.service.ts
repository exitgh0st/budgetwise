import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  hasSession = computed(() => !!this.currentUser());
  isEmailVerified = computed(() => this.isUserEmailVerified(this.currentUser()));
  isAuthenticated = computed(() => this.hasSession() && this.isEmailVerified());
  isLoading = signal(true);

  constructor() {
    // Check existing session on app startup
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.currentUser.set(data.session?.user ?? null);
      this.isLoading.set(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      this.currentUser.set(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        void this.router.navigate(['/login']);
      }
    });
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    this.currentUser.set(data.user ?? null);

    if (!this.isUserEmailVerified(data.user)) {
      return { ...data, requiresEmailVerification: true };
    }

    await this.onboard();
    return { ...data, requiresEmailVerification: false };
  }

  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: this.getEmailRedirectUrl(),
      },
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  async signOut() {
    await this.supabase.client.auth.signOut();
  }

  async clearSession() {
    const { error } = await this.supabase.client.auth.signOut({
      scope: 'local',
    });
    if (error) throw error;
    this.currentUser.set(null);
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      },
    );
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  async updateEmail(email: string) {
    const { data, error } = await this.supabase.client.auth.updateUser(
      { email },
      { emailRedirectTo: this.getEmailRedirectUrl() },
    );
    if (error) throw error;
    this.currentUser.set(data.user ?? this.currentUser());
    return data;
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async onboard(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/onboard`, {}));
    } catch {
      // Silently ignore onboard errors; unverified users retry after confirmation.
    }
  }

  isUserEmailVerified(user: User | null | undefined): boolean {
    if (!user) return false;

    if (
      typeof user.email_confirmed_at === 'string' &&
      user.email_confirmed_at.length > 0
    ) {
      return true;
    }

    return (
      user.user_metadata?.['email_verified'] === true ||
      user.app_metadata?.['email_verified'] === true
    );
  }

  private getEmailRedirectUrl(): string {
    return `${window.location.origin}/verify-email`;
  }
}
