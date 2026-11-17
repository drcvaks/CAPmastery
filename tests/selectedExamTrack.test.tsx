import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { useSelectedExamTrack } from "../features/content/hooks/useSelectedExamTrack";
import { useOptionalAuth } from "../features/auth/AuthContext";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../features/auth/AuthContext", () => ({ useOptionalAuth: jest.fn() }));

function Track({ name }: { name: string }) {
  const [id, choose] = useSelectedExamTrack(["leadership", "aerospace"], "leadership");
  return (
    <View>
      <Text>
        {name}: {id}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name} choose aerospace`}
        onPress={() => choose("aerospace")}
      >
        <Text>Choose Aerospace</Text>
      </Pressable>
    </View>
  );
}

it("shares track changes across mounted screens and keeps the choice after remounting", async () => {
  jest
    .mocked(useOptionalAuth)
    .mockReturnValue({ session: { user: { id: "shared-cadet" } } } as never);
  const view = await render(
    <View>
      <Track name="Home" />
      <Track name="Study" />
    </View>,
  );
  await fireEvent.press(screen.getByLabelText("Study choose aerospace"));
  await waitFor(() => expect(screen.getByText("Home: aerospace")).toBeVisible());
  expect(screen.getByText("Study: aerospace")).toBeVisible();
  await view.unmount();
  await render(<Track name="Study" />);
  expect(screen.getByText("Study: aerospace")).toBeVisible();
});
