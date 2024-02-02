"use client";
import { getAllFollowersAndFollowings, updateFollow } from "@/actions/user";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Skeleton, Typography } from "antd";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const FollowButton = ({ id, data, isLoading, isError }) => {
  const [followed, setFollowed] = useState(false);
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();

  // deciding the status of follow button
  useEffect(() => {
    if (data?.following?.map((person) => person?.followingId).includes(id)) {
      setFollowed(true);
    } else {
      setFollowed(false);
    }
  }, [data, setFollowed, id, isLoading]);

  const { mutate } = useMutation({
    mutationFn: updateFollow,

    onMutate: ({ type }) => {
      setFollowed(!followed);
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      // profile user
      queryClient.cancelQueries(["user", currentUser?.id, "followInfo"]);

      // Snapshot the previous value
      const snapShot = queryClient.getQueryData([
        "user",
        currentUser?.id,
        "followInfo",
      ]);

      queryClient.setQueryData(
        ["user", currentUser?.id, "followInfo"],
        (old) => {
          return {
            ...old,
            following:
              type === "follow"
                ? [...old.following, { followingId: id }]
                : old.following.filter((person) => person.followingId !== id),
          };
        }
      );

      // Return a context object with the snapshotted value
      return { snapShot };
    },

    onError: (err, variables, context) => {
      setFollowed(!followed);
      queryClient.setQueryData(
        ["user", currentUser?.id, "followInfo"],
        context.snapShot
      );
      toast.error("Something wrong happened. Try again!");
      console.error("Something wrong happened. Try again!", err);
    },

    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(["user", currentUser?.id, "followInfo"]);
    },
  });

  if (isLoading)
    return (
      <Skeleton.Button active={true} size="large" style={{ width: "100%" }} />
    );

  if (isError)
    return <Alert message="Error while fetching data" type="error" />;

  return (
    <Button
      type="primary"
      style={{
        background: "var(--gradient)",
      }}
      onClick={() => mutate({ id, type: followed ? "unfollow" : "follow" })}
    >
      <Typography className="typoSubtitle2" style={{ color: "white" }}>
        {followed ? "Unfollow" : "Follow"}
      </Typography>
    </Button>
  );
};

export default FollowButton;
