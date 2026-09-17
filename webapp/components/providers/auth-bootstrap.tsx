"use client";

import { useEffect } from "react";
import { useGetMeQuery } from "@/lib/store/api/authApi";
import { useAppDispatch } from "@/lib/store/hooks";
import { markAuthChecked, setUser } from "@/lib/store/slices/authSlice";

export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const { data, isFetching, isLoading, isUninitialized } = useGetMeQuery();

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
    } else if (!isFetching && !isLoading && !isUninitialized) {
      dispatch(markAuthChecked());
    }
  }, [data, dispatch, isFetching, isLoading, isUninitialized]);

  return null;
}
