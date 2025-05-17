"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Camera, Check, X, Home, Mail, MapPin, Calendar, User, Shield, Clock, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { testTextToSpeech } from "@/functions/ttsUtils";

type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  address: string | null;
  gender: string | null;
  tts_enabled?: boolean;
  stt_enabled?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          router.push("/login?message=Please log in to view your profile");
          return;
        }
        
        // Get user data from auth.users
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!userData.user) {
          router.push("/login?message=User not found");
          return;
        }
        
        const user = userData.user;
        
        // Set profile data
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || "",
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          avatar_url: user.user_metadata?.avatar_url || null,
          address: user.user_metadata?.address || null,
          gender: user.user_metadata?.gender || null,
          tts_enabled: user.user_metadata?.tts_enabled || false,
          stt_enabled: user.user_metadata?.stt_enabled || false,
        };
        
        setProfile(userProfile);
        setFirstName(userProfile.first_name);
        setLastName(userProfile.last_name);
        setAddress(userProfile.address || "");
        setGender(userProfile.gender || "");
        setAvatarUrl(userProfile.avatar_url);
        setTtsEnabled(userProfile.tts_enabled || false);
        setSttEnabled(userProfile.stt_enabled || false);
        
        // Format creation date
        if (user.created_at) {
          const date = new Date(user.created_at);
          setCreatedAt(date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        setError(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router, supabase]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleTTS = async () => {
    if (!isEditing) return;
    setTtsEnabled(!ttsEnabled);
  };

  const handleToggleSTT = async () => {
    if (!isEditing) return;
    setSttEnabled(!sttEnabled);
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      let newAvatarUrl = profile?.avatar_url;
      
      // Upload new avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        newAvatarUrl = urlData.publicUrl;
      }
      
      // Update user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          address,
          gender,
          avatar_url: newAvatarUrl,
          tts_enabled: ttsEnabled,
          stt_enabled: sttEnabled,
        }
      });
      
      if (error) throw error;
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          first_name: firstName,
          last_name: lastName,
          address,
          gender,
          avatar_url: newAvatarUrl || null,
          tts_enabled: ttsEnabled,
          stt_enabled: sttEnabled,
        });
      }
      
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const testTTS = async () => {
    try {
      await testTextToSpeech();
    } catch (error) {
      console.error('Error testing TTS:', error);
      setError('Failed to test text-to-speech');
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  
  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-primary/5 via-transparent to-transparent px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full py-4">
        {/* Back to home button */}
        <div className="mb-2">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 hover:bg-primary/5 h-8 px-3 py-1 text-sm">
              <Home className="h-3 w-3" />
              Back
            </Button>
          </Link>
        </div>
        
        {/* Profile content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden flex-1 flex flex-col">
          <div className="bg-gradient-to-b from-primary to-accent h-24 relative">
            {/* Profile avatar - centered on mobile, right side on desktop */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 h-24 w-24 rounded-full border-4 border-white overflow-hidden bg-white">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt="Profile" 
                  width={96} 
                  height={96} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-accent/10 text-accent text-3xl font-bold">
                  {profile?.first_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            
            {/* Name and email - hidden on mobile, visible on desktop */}
            <div className="hidden md:block absolute bottom-3 left-8 text-white">
              <h1 className="text-2xl font-cal font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-white/80 flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" />
                {profile?.email}
              </p>
            </div>
          </div>
          
          {/* Main content area with flex for vertical stretching */}
          <div className="p-4 pt-16 flex-1 flex flex-col overflow-hidden">
            {/* Mobile name display and edit button */}
            <div className="flex flex-col md:hidden items-center mb-3">
              <h1 className="text-xl font-cal font-bold text-accent mb-0.5">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-gray-500 flex items-center gap-1 text-xs mb-2">
                <Mail className="h-3 w-3" />
                {profile?.email}
              </p>
              
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-accent hover:bg-accent/90 text-white w-full max-w-xs h-8 text-sm"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2 w-full max-w-xs">
                  <Button 
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-gray-300 flex-1 h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-accent hover:bg-accent/90 text-white flex-1 h-8 text-xs"
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
            
            {/* Desktop section title and edit button */}
            <div className="hidden md:flex justify-between items-center mb-4">
              <h2 className="text-xl font-cal font-bold text-accent">Profile Information</h2>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-accent hover:bg-accent/90 text-white h-8 text-sm"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-gray-300 hover:bg-accent/10 h-8 text-sm"
                  >
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-accent hover:bg-accent/90 text-white h-8 text-sm"
                    disabled={updating}
                  >
                    {updating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
            
            {/* Mobile section title */}
            <h2 className="md:hidden text-lg font-cal font-bold text-accent mb-3">Profile Information</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-2 rounded-lg mb-3 text-xs">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-600 p-2 rounded-lg mb-3 text-xs">
                {success}
              </div>
            )}
            
            {/* Main content with overflow handling */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Profile details form */}
              <div className="md:col-span-2 overflow-auto pr-2">
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  {isEditing && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <label htmlFor="avatar-upload" className="flex items-center gap-2 cursor-pointer">
                        <div className="bg-accent text-white p-1.5 rounded-md">
                          <Camera className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 text-sm">Change Profile Picture</p>
                          <p className="text-xs text-gray-500">Click to upload a new image</p>
                        </div>
                        <input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarChange}
                        />
                      </label>
                      {avatarFile && (
                        <p className="mt-1 text-xs text-green-600 flex items-center">
                          <Check className="h-3 w-3 mr-1" /> New image selected
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-medium text-accent mb-1">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={cn(
                          "w-full p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-accent",
                          isEditing ? "border-gray-300" : "border-transparent bg-gray-50"
                        )}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-medium text-accent mb-1">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={cn(
                          "w-full p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-accent",
                          isEditing ? "border-gray-300" : "border-transparent bg-gray-50"
                        )}
                        disabled={!isEditing}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-accent mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      className="w-full p-1.5 text-sm border-transparent bg-gray-50 rounded-md"
                      disabled
                    />
                    <p className="mt-0.5 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-xs font-medium text-accent mb-1">
                      Address
                    </label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={cn(
                        "w-full p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-accent",
                        isEditing ? "border-gray-300" : "border-transparent bg-gray-50"
                      )}
                      disabled={!isEditing}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="gender" className="block text-xs font-medium text-accent mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={cn(
                        "w-full p-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-accent",
                        isEditing ? "border-gray-300" : "border-transparent bg-gray-50"
                      )}
                      disabled={!isEditing}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Text-to-Speech toggle */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-accent">Text-to-Speech</h4>
                        <p className="text-xs text-gray-500">Enable voice responses using ElevenLabs</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleTTS}
                        disabled={!isEditing}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
                          ttsEnabled ? "bg-accent" : "bg-gray-200",
                          !isEditing && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <span className="sr-only">Toggle text-to-speech</span>
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            ttsEnabled ? "translate-x-4" : "translate-x-0.5"
                          )}
                          style={{ marginTop: "2px" }}
                        />
                      </button>
                    </div>
                    
                    {ttsEnabled && isEditing && (
                      <button
                        type="button"
                        onClick={testTTS}
                        className="mt-2 text-xs text-accent flex items-center gap-1 hover:underline"
                      >
                        <Volume2 className="h-3 w-3" /> Test voice
                      </button>
                    )}
                  </div>

                  {/* Speech-to-Text toggle */}
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-accent">Speech-to-Text</h4>
                        <p className="text-xs text-gray-500">Enable voice input for messages</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleSTT}
                        disabled={!isEditing}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
                          sttEnabled ? "bg-accent" : "bg-gray-200",
                          !isEditing && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        <span className="sr-only">Toggle speech-to-text</span>
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            sttEnabled ? "translate-x-4" : "translate-x-0.5"
                          )}
                          style={{ marginTop: "2px" }}
                        />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Note: Speech recognition requires microphone access and is only available in supported browsers.
                    </p>
                  </div>
                </form>
              </div>
              
              {/* Account information */}
              <div className="bg-gray-50 p-3 rounded-lg h-fit hidden md:block">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Account Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Account ID</p>
                      <p className="text-xs text-gray-500 break-all">{profile?.id}</p>
                    </div>
                  </div>
                  
                  {createdAt && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-700">Member Since</p>
                        <p className="text-xs text-gray-500">{createdAt}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-accent mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Profile Status</p>
                      <div className="flex items-center mt-0.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                        <span className="text-xs text-gray-500">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    {ttsEnabled ? (
                      <Volume2 className="h-4 w-4 text-accent mt-0.5" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-700">Text-to-Speech</p>
                      <p className="text-xs text-gray-500">
                        {ttsEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    {sttEnabled ? (
                      <Mic className="h-4 w-4 text-accent mt-0.5" />
                    ) : (
                      <MicOff className="h-4 w-4 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-700">Speech-to-Text</p>
                      <p className="text-xs text-gray-500">
                        {sttEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
