// src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  employee_id: string;
  department?: string;
  position?: string;
  hire_date?: string;
  salary?: number;
  user_role: "admin" | "employee";
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ data: Profile | null; error: any }>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const createBasicProfile = async (user: User): Promise<Profile | null> => {
    try {
      console.log("Creating basic profile for user:", user.id);
      
      const basicProfile = {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "New User",
        employee_id: `EMP${Date.now()}`,
        user_role: "employee" as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([basicProfile])
        .select()
        .single();

      if (error) {
        console.error("Error creating basic profile:", error);
        // Return a temporary profile object for the session
        return {
          ...basicProfile,
          avatar_url: undefined,
          phone: undefined,
          address: undefined,
          department: undefined,
          position: undefined,
          hire_date: undefined,
          salary: undefined,
          manager_id: undefined,
        } as Profile;
      }

      console.log("Basic profile created successfully:", data);
      return data;
    } catch (error) {
      console.error("Unexpected error creating profile:", error);
      return null;
    }
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log("Fetching profile for user:", userId);
      
      // Check if profiles table exists by trying a simple query
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Handle different types of errors
      if (error) {
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // If table doesn't exist, return null and let the app handle it
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn("Profiles table does not exist. Please run the database setup.");
          return null;
        }

        // If it's a permission error, try to create a basic profile
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          console.warn("Permission denied. Trying to create basic profile...");
          const currentUser = (await supabase.auth.getUser()).data.user;
          if (currentUser) {
            return await createBasicProfile(currentUser);
          }
        }

        return null;
      }

      if (!data) {
        console.log("No profile found, creating basic profile...");
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser) {
          return await createBasicProfile(currentUser);
        }
        return null;
      }

      console.log("Profile fetched successfully");
      return data;
    } catch (error) {
      console.error("Unexpected error in fetchProfile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Session found for user:", session.user.id);
          setUser(session.user);
          
          // Try to fetch profile, but don't fail if it doesn't work
          try {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } catch (profileError) {
            console.warn("Could not fetch profile:", profileError);
            // Create a minimal profile object so the app can still work
            setProfile({
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || "User",
              employee_id: `EMP${Date.now()}`,
              user_role: "employee",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Profile);
          }
        } else {
          console.log("No active session");
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);

        if (session?.user) {
          setUser(session.user);
          try {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } catch (error) {
            console.warn("Could not fetch profile on auth change:", error);
            setProfile({
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || "User",
              employee_id: `EMP${Date.now()}`,
              user_role: "employee",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Profile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      return { data, error };
    } catch (error: any) {
      console.error("Sign up error:", error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error: any) {
      console.error("Sign in error:", error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setProfile(null);
      }
      return { error };
    } catch (error: any) {
      console.error("Sign out error:", error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: "No user logged in" };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (data && !error) {
        setProfile(data);
      }

      return { data, error };
    } catch (error) {
      console.error("Update profile error:", error);
      return { data: null, error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: profile?.user_role === "admin",
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};