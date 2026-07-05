from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, validate_image_file


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    profile_image = serializers.ImageField(validators=[validate_image_file], required=False, allow_null=True)

    class Meta:
        model = Profile
        fields = [
            'username', 'full_name', 'email', 'first_name', 'last_name',
            'profile_image', 'bio', 'phone_number', 'designation',
            'appearance_theme', 'font_size', 'compact_mode',
            'timezone', 'language', 'date_format', 'time_format',
            'show_online_status', 'show_last_seen', 'allow_dm', 'allow_team_invites', 'profile_visibility',
            'notification_preferences', 'created_at', 'updated_at'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        user.email = user_data.get('email', user.email)
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.save()

        if 'profile_image' in validated_data:
            if instance.profile_image:
                instance.profile_image.delete(save=False)
            instance.profile_image = validated_data['profile_image']
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password", "full_name", "company_name"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value



    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        validated_data.pop("company_name", "")

        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=first_name,
            last_name=last_name,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
