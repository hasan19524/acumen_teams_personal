from uuid import uuid4

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from django.core.paginator import Paginator
from django.utils.text import slugify

from .models import Channel, ChannelMember, Message
from .serializers import ChannelSerializer, MessageSerializer
from workspaces.models import UserProfile, Team


class ChannelListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        channels = (
            Channel.objects.filter(members__user=request.user)
            .select_related("created_by", "team")
            .distinct()
            .order_by("name")
        )
        serializer = ChannelSerializer(channels, many=True)
        return Response(serializer.data)

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        team_id = request.data.get("team_id")  # optional

        if not name:
            return Response(
                {"error": "Channel name required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            return Response({"error": "No profile found"}, status=400)

        # Permission check
        if profile.role == "employee":
            return Response(
                {"error": "Only admins and team leaders can create channels"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Team leaders can only create channels for their own team
        if profile.role == "leader":
            team_id = profile.team_id  # force their own team

        # Resolve team
        team = None
        if team_id:
            try:
                team = Team.objects.get(id=team_id, workspace=profile.workspace)
            except Team.DoesNotExist:
                return Response({"error": "Team not found"}, status=404)

        slug = slugify(name)
        if Channel.objects.filter(slug=slug).exists():
            slug = f"{slug}-{uuid4().hex[:6]}"

        channel = Channel.objects.create(
            name=name,
            slug=slug,
            created_by=request.user,
            workspace=profile.workspace,
            team=team,
        )

        # Auto-add members based on scope
        if team:
            # Add only that team's members
            members = UserProfile.objects.filter(
                team=team, workspace=profile.workspace
            ).select_related("user")
        else:
            # General channel — add all workspace members
            members = UserProfile.objects.filter(
                workspace=profile.workspace
            ).select_related("user")

        for m in members:
            ChannelMember.objects.get_or_create(
                channel=channel, user=m.user, defaults={"role": "member"}
            )

        # Make sure creator is admin
        ChannelMember.objects.filter(channel=channel, user=request.user).update(
            role="admin"
        )

        return Response(ChannelSerializer(channel).data, status=status.HTTP_201_CREATED)


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, channel_id):
        is_member = ChannelMember.objects.filter(
            channel_id=channel_id, user=request.user
        ).exists()

        if not is_member:
            return Response(
                {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
            )

        page = int(request.GET.get("page", 1))

        messages = (
            Message.objects.filter(channel_id=channel_id)
            .select_related("sender")
            .order_by("-created_at")
        )

        paginator = Paginator(messages, 30)
        page_obj = paginator.get_page(page)

        serializer = MessageSerializer(page_obj.object_list, many=True)

        return Response(
            {
                "results": serializer.data[::-1],
                "page": page,
                "has_next": page_obj.has_next(),
                "total_pages": paginator.num_pages,
            }
        )


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        channel_id = request.data.get("channel_id")
        content = (request.data.get("content") or "").strip()

        if not content:
            return Response(
                {"error": "Message cannot be empty"}, status=status.HTTP_400_BAD_REQUEST
            )

        is_member = ChannelMember.objects.filter(
            channel_id=channel_id, user=request.user
        ).exists()

        if not is_member:
            return Response(
                {"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN
            )

        msg = Message.objects.create(
            channel_id=channel_id, sender=request.user, content=content
        )

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
