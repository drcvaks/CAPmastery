import { Link } from "expo-router";
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
});
