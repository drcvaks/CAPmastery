import { type Href, Link, Stack, Tabs } from "expo-router";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";

describe("shell navigation", () => {
  it("navigates from the root to the student shell", async () => {
    await renderRouter(
      {
        index: () => (
          <Link href="/home">
            <Text>Open student shell</Text>
          </Link>
        ),
        home: () => <Text>Student home</Text>,
      },
      { initialUrl: "/" },
    );

    await fireEvent.press(screen.getByText("Open student shell"));

    expect(screen.getByText("Student home")).toBeVisible();
  });

  it("preserves the active Study stack while visiting another tab", async () => {
    await renderRouter(
      {
        _layout: () => (
          <Tabs>
            <Tabs.Screen name="study" options={{ title: "Study" }} />
            <Tabs.Screen name="progress" options={{ title: "Progress" }} />
          </Tabs>
        ),
        "study/_layout": () => <Stack screenOptions={{ headerShown: false }} />,
        "study/index": () => (
          <Link href={"/study/session/example" as Href}>
            <Text>Start session</Text>
          </Link>
        ),
        "study/session/[sessionId]": () => <Text>Active question</Text>,
        progress: () => <Text>Progress screen</Text>,
      },
      { initialUrl: "/study" },
    );

    await fireEvent.press(screen.getByText("Start session"));
    expect(screen.getByText("Active question")).toBeVisible();

    await fireEvent.press(screen.getByText("Progress"));
    expect(screen.getByText("Progress screen")).toBeVisible();

    await fireEvent.press(screen.getByText("Study"));
    expect(screen.getByText("Active question")).toBeVisible();
  });
});
