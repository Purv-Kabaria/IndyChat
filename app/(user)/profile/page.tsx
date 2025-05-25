"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Camera,
  Check,
  X,
  Mail,
  Calendar,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ArrowLeft,
  Edit3,
  Save,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { testTextToSpeech } from "@/functions/ttsUtils";
import { auth, getUserProfile, updateUserProfile } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from "firebase/auth";
import { UserProfile } from "@/lib/auth-context";
import { Timestamp } from "firebase/firestore";

const SignOutButton = () => {
  const router = useRouter();
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login?message=You have been signed out");
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error (e.g., show a notification)
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleSignOut}
      type="button"
      className="w-full sm:w-auto">
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [isTestingTTS, setIsTestingTTS] = useState(false);
  const [lastTestTimestamp, setLastTestTimestamp] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const unsubscribe = onAuthStateChanged(
          auth,
          async (user: FirebaseUser | null) => {
            if (!user) {
              router.push("/login?message=Please log in to view your profile");
              return;
            }

            try {
              const profileData = await getUserProfile(user.uid);

              if (!profileData) {
                console.log("No profile found for user, creating basic one");
                const initialProfile: UserProfile = {
                  id: user.uid,
                  email: user.email || "",
                  first_name: user.displayName?.split(" ")[0] || "",
                  last_name:
                    user.displayName?.split(" ").slice(1).join(" ") || "",
                  avatar_url: user.photoURL || null,
                  address: null,
                  gender: null,
                  tts_enabled: false,
                  stt_enabled: false,
                };
                await updateUserProfile(user.uid, {
                  ...initialProfile,
                  updated_at: new Date().toISOString(),
                });
                setProfile(initialProfile);
                setFirstName(initialProfile.first_name || "");
                setLastName(initialProfile.last_name || "");
                setAvatarUrl(
                  initialProfile.avatar_url !== undefined
                    ? initialProfile.avatar_url
                    : null
                );
                setAddress(initialProfile.address || "");
                setGender(initialProfile.gender || "");
                setTtsEnabled(initialProfile.tts_enabled || false);
                setSttEnabled(initialProfile.stt_enabled || false);
                if (user.metadata.creationTime) {
                  const date = new Date(user.metadata.creationTime);
                  setCreatedAt(date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
                }
              } else {
                const existingProfile: UserProfile = {
                  ...profileData,
                  id: user.uid,
                  email: user.email || profileData.email || "",
                  first_name: profileData.first_name || "",
                  last_name: profileData.last_name || "",
                  avatar_url: profileData.avatar_url || null,
                  address: profileData.address || null,
                  gender: profileData.gender || null,
                  tts_enabled: profileData.tts_enabled || false,
                  stt_enabled: profileData.stt_enabled || false,
                };
                setProfile(existingProfile);
                setFirstName(existingProfile.first_name || "");
                setLastName(existingProfile.last_name || "");
                setAddress(existingProfile.address || "");
                setGender(existingProfile.gender || "");
                setAvatarUrl(existingProfile.avatar_url || null);
                setTtsEnabled(existingProfile.tts_enabled || false);
                setSttEnabled(existingProfile.stt_enabled || false);

                let determinedCreatedAt: string | null = null;
                const creationTimestamp: Timestamp | string | null | undefined =
                  profileData.created_at;
                if (creationTimestamp) {
                  const date =
                    creationTimestamp instanceof Timestamp
                      ? creationTimestamp.toDate()
                      : new Date(creationTimestamp as string);
                  determinedCreatedAt = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                } else if (user.metadata.creationTime) {
                  const date = new Date(user.metadata.creationTime);
                  determinedCreatedAt = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                }
                setCreatedAt(determinedCreatedAt);
              }
            } catch (error) {
              console.error("Error fetching profile:", error);
              setError("Failed to load profile data.");
            } finally {
              setLoading(false);
            }
          }
        );
        return () => unsubscribe();
      } catch (error: unknown) {
        console.error("Error in auth state:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to initialize profile page."
        );
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleTTS = () => {
    if (isEditing) setTtsEnabled(!ttsEnabled);
  };
  const handleToggleSTT = () => {
    if (isEditing) setSttEnabled(!sttEnabled);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      let newAvatarUrl = profile?.avatar_url;
      if (avatarFile && auth.currentUser) {
        const storage = getStorage();
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `avatars/${
          auth.currentUser.uid
        }-${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, avatarFile);
        newAvatarUrl = await getDownloadURL(storageRef);
      }

      if (!auth.currentUser)
        throw new Error("No authenticated user found. Please log in again.");

      const updatedProfileData = {
        first_name: firstName,
        last_name: lastName,
        address,
        gender,
        avatar_url: newAvatarUrl || null,
        tts_enabled: ttsEnabled,
        stt_enabled: sttEnabled,
        updated_at: new Date().toISOString(),
      };
      await updateUserProfile(auth.currentUser.uid, updatedProfileData);

      setProfile((prev) =>
        prev
          ? { ...prev, ...updatedProfileData, email: prev.email, id: prev.id }
          : null
      );
      setAvatarFile(null);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile."
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const testTTS = async () => {
    const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
    if (
      lastTestTimestamp &&
      Date.now() - lastTestTimestamp < FIVE_MINUTES_IN_MS
    ) {
      const timeLeft = FIVE_MINUTES_IN_MS - (Date.now() - lastTestTimestamp);
      const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
      setError(
        `Please wait ~${minutesLeft} minute(s) before testing TTS again.`
      );
      setSuccess(null);
      return;
    }
    setIsTestingTTS(true);
    setError(null);
    setSuccess(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser)
        throw new Error("You must be logged in to test text-to-speech.");
      const token = await currentUser.getIdToken(true);
      await testTextToSpeech(token);
      setLastTestTimestamp(Date.now());
      setSuccess("TTS test initiated! Listening for 'Hello'...");
      setTimeout(() => setSuccess(null), 4000);
    } catch (error: unknown) {
      console.error("TTS test failed:", error);
      setError(
        error instanceof Error ? error.message : "Text to speech test failed."
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTestingTTS(false);
    }
  };

  const handleGoBack = () => router.push("/chat");

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAddress(profile.address || "");
      setGender(profile.gender || "");
      setAvatarUrl(profile.avatar_url || null);
      setTtsEnabled(profile.tts_enabled || false);
      setSttEnabled(profile.stt_enabled || false);
      setAvatarFile(null);
    }
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      <header className="bg-accent text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-white hover:bg-accent/80"
              onClick={handleGoBack}>
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-xl font-semibold">Your Profile</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSaveProfile}>
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow flex items-start">
              <X className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" /> <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg shadow flex items-start">
              <Check className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />{" "}
              <p>{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-2 border-accent">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profile Avatar"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent/10">
                          <User size={60} className="text-accent/70" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-1 -right-1 bg-accent text-white p-2 rounded-full cursor-pointer hover:bg-accent/80 transition-colors">
                        <Camera size={18} />
                        <input
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {profile?.first_name || "User"} {profile?.last_name || ""}
                    </h2>
                    <p className="text-sm text-gray-500 flex items-center justify-center mt-1">
                      <Mail className="w-4 h-4 mr-1.5" />
                      {profile?.email}
                    </p>
                    {createdAt && (
                      <p className="text-xs text-gray-400 flex items-center justify-center mt-1">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        Member since {createdAt}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {!isEditing ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="w-full bg-accent hover:bg-accent/90 text-white">
                      <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                        disabled={updating}>
                        {updating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="w-full hover:bg-accent hover:text-white"
                        disabled={updating}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Account Security
                </h3>
                <SignOutButton />
              </section>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing || updating}
                      className={cn(
                        "w-full p-2.5 border rounded-md text-sm",
                        isEditing
                          ? "border-gray-300 focus:ring-accent focus:border-accent"
                          : "bg-gray-50 border-gray-200 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing || updating}
                      className={cn(
                        "w-full p-2.5 border rounded-md text-sm",
                        isEditing
                          ? "border-gray-300 focus:ring-accent focus:border-accent"
                          : "bg-gray-50 border-gray-200 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={!isEditing || updating}
                      placeholder={isEditing ? "Enter your address" : "Not set"}
                      className={cn(
                        "w-full p-2.5 border rounded-md text-sm",
                        isEditing
                          ? "border-gray-300 focus:ring-accent focus:border-accent"
                          : "bg-gray-50 border-gray-200 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      disabled={!isEditing || updating}
                      className={cn(
                        "w-full p-2.5 border rounded-md text-sm",
                        isEditing
                          ? "border-gray-300 focus:ring-accent focus:border-accent"
                          : "bg-gray-50 border-gray-200 appearance-none cursor-not-allowed"
                      )}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
                  Accessibility Settings
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      {ttsEnabled ? (
                        <Volume2 className="h-5 w-5 text-accent mr-3" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-gray-400 mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-700">
                          Text to Speech
                        </div>
                        <p className="text-xs text-gray-500">
                          Enable voice responses from the assistant
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={testTTS}
                        disabled={!ttsEnabled || isTestingTTS || updating}
                        className={cn(
                          "text-xs px-2.5 py-1 hover:bg-accent hover:text-white",
                          !ttsEnabled && "opacity-50 cursor-not-allowed"
                        )}>
                        {isTestingTTS ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : null}
                        {isTestingTTS ? "Testing..." : "Test"}
                      </Button>
                      <button
                        type="button"
                        onClick={handleToggleTTS}
                        disabled={!isEditing || updating}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
                          ttsEnabled ? "bg-accent" : "bg-gray-300",
                          (!isEditing || updating) &&
                            "opacity-60 cursor-not-allowed"
                        )}>
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            ttsEnabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      {sttEnabled ? (
                        <Mic className="h-5 w-5 text-accent mr-3" />
                      ) : (
                        <MicOff className="h-5 w-5 text-gray-400 mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-700">
                          Speech to Text
                        </div>
                        <p className="text-xs text-gray-500">
                          Enable voice input to the assistant
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleSTT}
                      disabled={!isEditing || updating}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
                        sttEnabled ? "bg-accent" : "bg-gray-300",
                        (!isEditing || updating) &&
                          "opacity-60 cursor-not-allowed"
                      )}>
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          sttEnabled ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
