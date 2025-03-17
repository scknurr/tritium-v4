import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { formatDate, formatFullName, getInitials } from "@/lib/utils";
import { Profile } from "@/types";

interface UserProfileDisplayProps {
  profile: Profile;
  showDetails?: boolean;
}

export function UserProfileDisplay({ profile, showDetails = true }: UserProfileDisplayProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || ''} alt={formatFullName(profile.first_name, profile.last_name, profile.email)} />
          <AvatarFallback>{getInitials(formatFullName(profile.first_name, profile.last_name, profile.email))}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-medium">{formatFullName(profile.first_name, profile.last_name, profile.email)}</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent>
          <div className="grid gap-2">
            {profile.title && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Title:</span>
                <span className="text-sm">{profile.title}</span>
              </div>
            )}
            {profile.created_at && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Joined:</span>
                <span className="text-sm">{formatDate(profile.created_at)}</span>
              </div>
            )}
            {profile.bio && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Bio:</span>
                <span className="text-sm">{profile.bio}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
} 