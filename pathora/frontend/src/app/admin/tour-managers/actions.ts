"use server";

export async function logToServer(message: string, data: any) {
  console.log(`[Server Log] ${message}`, data);
}
