% Standard form for second-order band pass
% H(s) = (2*r*wn*s)/(s^2 + 2*r*wn*s +wn^2)
% where r = damping ratio and wn = undamped natural frequency

% also for RLC series
% H(s) = (sR/L)/(s^2 sR/L s/(L*C)])

% and for Sallen-key Band Pass
% H(s) = (G * R * C*s)/(1 + R^2 *C^2 *s^2 + RCs(3-G))
% where G = (R1+R2)/R1

% Sample values
wn = 2*pi*500; % undamped natural frequency (in rad/s)
t = linspace(0,0.01,2000); % Time

%% Underdamped case
damping_ratio = 0.5;

% General transfer fn
numerator = [0 2*damping_ratio*wn 0];
denominator = [1 2*damping_ratio*wn wn^2];
H = tf(numerator, denominator); % transfer function
y = step(H, t); % v(t) response
figure;
plot(t, y, 'LineWidth', 1.2);
xlabel('Time (s)'); 
ylabel('v(t)'); 
title('Voltage against Time for General 2nd Order Bandpass (Underdamped)');
grid on; hold on;

% RLC Transfer fn
L = 1e-3; C = 1/(wn^2 * L); % sample values for L and C to match with wn
R = 2 * damping_ratio * wn * L;
H = tf([R/L 0], [1 R/L 1/(L*C)]);
yR = step(H, t);
plot(t, yR, '--', 'LineWidth', 1); hold on;

% Sallen-key transfer fn
C = 10e-9; % sample values for C and R & G to match with wn
R = 1 / (wn * C); 
G = 3 - 2*damping_ratio; % assuming a unity gain for simplicity
numerator = [(G / (R * C)), 0];
denominator = [1, (3 - G)/(R * C), 1 / (R^2 * C^2)];
H = tf(numerator, denominator);
y = step(H * (2*damping_ratio/G), t); % to remove gain from opamp for unity gain
plot(t, y, ':', 'LineWidth', 1);

legend("General Band pass", "RLC as band pass", "Sallen-key 2nd order band pass")

%% Critically damped case
damping_ratio = 1;

% General transfer fn
numerator = [0 2*damping_ratio*wn 0];
denominator = [1 2*damping_ratio*wn wn^2];
H = tf(numerator, denominator); % transfer function
y = step(H, t); % v(t) response
figure;
plot(t, y, 'LineWidth', 1.2);
xlabel('Time (s)'); 
ylabel('v(t)'); 
title('Voltage against Time for General 2nd Order Bandpass (Critically damped)');
grid on; hold on;

% RLC Transfer fn
L = 1e-3; C = 1/(wn^2 * L); % sample values for L and C to match with wn
R = 2 * damping_ratio * wn * L;
G = tf([R/L 0], [1 R/L 1/(L*C)]);
yR = step(G, t);
plot(t, yR, '--', 'LineWidth', 1); hold on;

% Sallen-key transfer fn
C = 10e-9; % sample values for C and R & G to match with wn
R = 1 / (wn * C); 
G = 3 - 2*damping_ratio; % assuming a unity gain for simplicity
numerator = [(G / (R * C)), 0];
denominator = [1, (3 - G)/(R * C), 1 / (R^2 * C^2)];
H = tf(numerator, denominator);
y = step(H * (2*damping_ratio/G), t); % to remove gain from opamp for unity gain
plot(t, y, ':', 'LineWidth', 1);

legend("General Band pass", "RLC as band pass", "Sallen-key 2nd order band pass")

%% Overdamped case
damping_ratio = 1.3;

% General transfer fn
numerator = [0 2*damping_ratio*wn 0];
denominator = [1 2*damping_ratio*wn wn^2];
H = tf(numerator, denominator); % transfer function
y = step(H, t); % v(t) response
figure;
plot(t, y, 'LineWidth', 1.2);
xlabel('Time (s)'); 
ylabel('v(t)'); 
title('Voltage against Time for General 2nd Order Bandpass (Overdamped)');
grid on; hold on;

% RLC Transfer fn
L = 1e-3; C = 1/(wn^2 * L); % sample values for L and C to match with wn
R = 2 * damping_ratio * wn * L;
G = tf([R/L 0], [1 R/L 1/(L*C)]);
yR = step(G, t);
plot(t, yR, '--', 'LineWidth', 1); hold on;

% Sallen-key transfer fn
C = 10e-9; % sample values for C and R & G to match with wn
R = 1 / (wn * C); 
G = 3 - 2*damping_ratio; % assuming a unity gain for simplicity
numerator = [(G / (R * C)), 0];
denominator = [1, (3 - G)/(R * C), 1 / (R^2 * C^2)];
H = tf(numerator, denominator);
y = step(H * (2*damping_ratio/G), t); % to remove gain from opamp for unity gain
plot(t, y, ':', 'LineWidth', 1);

legend("General Band pass", "RLC as band pass", "Sallen-key 2nd order band pass")