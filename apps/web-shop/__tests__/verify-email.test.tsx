import { render, screen, waitFor } from "@testing-library/react";
import { VerifyEmailPage } from "@/components/features/auth/VerifyEmailPage";

// --- Mocks ---------------------------------------------------------------

const mockPush = jest.fn();
let mockToken: string | null = "valid-token";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => mockToken }),
}));

const mockVerifyEmail = jest.fn();
jest.mock("@/lib/api/api-client", () => ({
  authApi: {
    verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
  },
}));

// next/image renders a plain <img> in jsdom.
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as { src: string })} />;
  },
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToken = "valid-token";
  });

  it("calls the verify endpoint with the token from the URL", async () => {
    mockVerifyEmail.mockResolvedValueOnce({ message: "ok" });
    render(<VerifyEmailPage />);

    await waitFor(() => expect(mockVerifyEmail).toHaveBeenCalledWith("valid-token"));
  });

  it("shows the Verified User screen and a Go to Login button on success", async () => {
    mockVerifyEmail.mockResolvedValueOnce({ message: "ok" });
    render(<VerifyEmailPage />);

    expect(await screen.findByText("Verified User")).toBeInTheDocument();
    const loginButton = screen.getByRole("button", { name: /go to login/i });
    expect(loginButton).toBeInTheDocument();

    loginButton.click();
    expect(mockPush).toHaveBeenCalledWith("/signin");
  });

  it("shows a failure message when verification is rejected", async () => {
    mockVerifyEmail.mockRejectedValueOnce({
      data: { detail: "Invalid or expired confirmation link." },
    });
    render(<VerifyEmailPage />);

    expect(await screen.findByText("Verification failed")).toBeInTheDocument();
    expect(
      screen.getByText("Invalid or expired confirmation link.")
    ).toBeInTheDocument();
    // No login button on the error path.
    expect(screen.queryByRole("button", { name: /go to login/i })).not.toBeInTheDocument();
  });

  it("shows an error without calling the API when the token is missing", async () => {
    mockToken = null;
    render(<VerifyEmailPage />);

    expect(await screen.findByText("Verification failed")).toBeInTheDocument();
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });
});
